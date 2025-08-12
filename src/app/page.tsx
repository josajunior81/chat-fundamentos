'use client';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { FundamentosUIMessage } from './types';
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from '@/components/ai-elements/response';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { PromptInput, PromptInputSubmit, PromptInputTextarea, PromptInputToolbar } from '@/components/ai-elements/prompt-input';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/source';
import { Loader } from '@/components/ai-elements/loader';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat<FundamentosUIMessage>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
      );
      setInput('');
    }
  };

  return (
    <div className='h-screen'>
      <div className="flex flex-col justify-center text-center h-24 bg-neutral-300 dark:bg-neutral-900 rounded-sm shadow-lg overflow-hidden">
        <h1 className='text-3xl font-bold text-black dark:text'>Chat Fundamentos</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 relative size-full h-7/8">
        <div className="flex flex-col h-full">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' && (
                    <Sources>
                      <SourcesTrigger count={message.metadata?.files?.length || 0} />
                      {message.metadata?.files && message.metadata.files.length > 0 &&
                        message.metadata.files.map((file, index) => {
                          return (
                            <SourcesContent key={`${message.id}-${index}`}>
                              <Source
                                key={`${message.id}-${file}`}
                                title={file}
                              />
                            </SourcesContent>
                          )
                        }
                        )}
                    </Sources>
                  )}
                  <Message from={message.role} key={`${message.id}-${message.role}`}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {part.text}
                              </Response>
                            );
                          case 'reasoning':
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                isStreaming={status === 'streaming'}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                </div>
              ))}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder='Pergunta algo sobre fundamentos...'
            />
            <PromptInputToolbar className='justify-end'>
              <PromptInputSubmit disabled={!input} status={status} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div >
  );
}