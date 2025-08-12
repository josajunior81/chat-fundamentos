import { MessageMetadata } from './../../types';
import 'dotenv/config';

import { ChatMistralAI } from "@langchain/mistralai";
import { toUIMessageStream } from '@ai-sdk/langchain';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createUIMessageStream, createUIMessageStreamResponse, UIMessage, InferUIMessageChunk } from 'ai';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { NomicEmbeddings } from "@langchain/nomic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { FundamentosUIMessage } from '@/app/types';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  const {
    messages,
  }: {
    messages: FundamentosUIMessage[];
  } = await req.json();

  console.log('Received messages:', JSON.stringify(messages));

  const model = new ChatMistralAI({
    model: 'mistral-medium',
    temperature: 0,
  });

  const nomicEmbeddings = new NomicEmbeddings({ apiKey: process.env.NOMIC_API_KEY, model: "gte-multilingual-base" });

  const vectorStore = await FaissStore.loadFromPython(
    `E:\\fundamentos\\app\\upstash\\faiss_db`,
    nomicEmbeddings,
  );

  const text = messages[messages.length - 1].parts.map((part) => part.type === 'text' ? part.text : '').join('');

  const similaritySearchResults = await vectorStore.similaritySearch(text, 2);

  let templateContext = similaritySearchResults.map(doc => doc.pageContent).join('\n\n');
  let metadataContext = similaritySearchResults.map(doc => doc.metadata) as MessageMetadata[];

  const template = `Você é um assistente de IA cristã que conhece as lições de fundamentos e responde estritamente o que esta no contexto abaixo. 
  ----------------
  {context}`;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", template.replace("{context}", templateContext)],
    ["human", text],
  ]);

  const chain = prompt.pipe(model);

  const chainStream = await chain.stream(
    messages.map((message: FundamentosUIMessage) =>
      message.role == 'user'
        ? new HumanMessage(

          message.parts
            .map(part => (part.type === 'text' ? part.text : ''))
            .join(''),
        )
        : new AIMessage(
          message.parts
            .map(part => (part.type === 'text' ? part.text : ''))
            .join(''),
        ),
    ),
  );

  const messageStream = createUIMessageStream<FundamentosUIMessage>({
    execute({ writer }) {
      writer.write({
        type: 'message-metadata',
        messageMetadata: {
          cycle: metadataContext.map(m => m.cycle).join(', '),
          title: metadataContext.map(m => m.title).join(', '),
          author: metadataContext.map(m => m.author).join(', '),
        },
      });

      writer.merge(
        toUIMessageStream(chainStream) as ReadableStream<InferUIMessageChunk<FundamentosUIMessage>>
      );
    }
  });

  const ui = createUIMessageStreamResponse({
    stream: messageStream
  });


  return ui;
}