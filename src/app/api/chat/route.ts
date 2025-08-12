import 'dotenv/config';

import { ChatMistralAI } from "@langchain/mistralai";
import { toUIMessageStream } from '@ai-sdk/langchain';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { createUIMessageStream, createUIMessageStreamResponse, InferUIMessageChunk } from 'ai';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { NomicEmbeddings } from "@langchain/nomic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { FundamentosUIMessage } from '@/app/types';

import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  const {
    messages,
  }: {
    messages: FundamentosUIMessage[];
  } = await req.json();

  const model = new ChatMistralAI({
    model: 'mistral-medium',
    temperature: 0,
  });

  const nomicEmbeddings = new NomicEmbeddings({ apiKey: process.env.NOMIC_API_KEY, model: "gte-multilingual-base" });

  // const faissDir = await loadFaissDB();
  const faissDir = path.join(process.cwd(), 'faiss_db');

  const vectorStore = await FaissStore.loadFromPython(
    faissDir,
    nomicEmbeddings,
  );

  const text = messages[messages.length - 1].parts.map((part) => part.type === 'text' ? part.text : '').join('');

  const similaritySearchResults = await vectorStore.similaritySearch(text, 5);

  const templateContext = similaritySearchResults.map(doc => doc.pageContent).join('\n\n');
  const metadataContext = Array.from(new Set(similaritySearchResults.map(doc => doc.metadata['title']).flat()));

  console.log('metadataContext:', metadataContext);

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
          files: metadataContext,
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

// async function loadFaissDB() {

//   const faissDir = path.join(process.cwd(), 'faiss_db');

//   if (fs.existsSync(faissDir) && fs.existsSync(path.join(faissDir, 'index.faiss')) && fs.existsSync(path.join(faissDir, 'index.pkl'))) {
//     console.log('FAISS DB already exists, skipping download.');
//     return faissDir;
//   }

//   const faissUrl = "https://f43hbmzt3ovbfckl.public.blob.vercel-storage.com/fundamentos/faiss/index.faiss";
//   const faissPklUrl = "https://f43hbmzt3ovbfckl.public.blob.vercel-storage.com/fundamentos/faiss/index.pkl";

//   const faissIndex = await fetch(faissUrl).then(res => res.arrayBuffer());
//   const faissPkl = await fetch(faissPklUrl).then(res => res.arrayBuffer());

//   if (!faissIndex || !faissPkl) {
//     throw new Error('Failed to fetch FAISS index or PKL file');
//   }

//   fs.mkdirSync(faissDir, { recursive: true });

//   const faissIndexPath = path.join(faissDir, 'index.faiss');
//   const faissPklPath = path.join(faissDir, 'index.pkl');

//   fs.writeFileSync(faissIndexPath, Buffer.from(faissIndex));
//   fs.writeFileSync(faissPklPath, Buffer.from(faissPkl));

//   return faissDir;
// }
