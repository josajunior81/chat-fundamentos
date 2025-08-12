'use client';
import { Input } from "@/components/ui/input"
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { FundamentosUIMessage } from './types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat<FundamentosUIMessage>();

  return (
    <div className="flex flex-col w-full max-h-7/8 max-w-7/8 py-24 mx-auto stretch">
      <div className='h-[calc(100vh/1/1.5)] overflow-y-scroll'>
        {messages.map(message => (
          <div key={message.id} className="whitespace-pre-wrap gap-2">
            <div className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <Card className={message.role === 'user' ? 'bg-slate-100 w-1/2 text-right' : 'bg-neutral-100 w-1/2'} >
                <CardHeader>
                  <CardTitle>{message.role === 'user' ? 'Usuário' : 'Fundamentos IA'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <div key={`${message.id}-${i}`}>{part.text}</div>;
                    }
                  })}
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  {message.role !== 'user' ? <div className="text-xs">Disponível nas lições: {message.metadata?.title}</div> : null}
                </CardFooter>
              </Card>
            </div>
          </div>
        ))}
      </div>

      <div className=''>
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage({ text: input });
            setInput('');
          }}
        >
          <Input
            value={input}
            placeholder="Pergunte sobre fundamentos..."
            onChange={e => setInput(e.currentTarget.value)}
          />
        </form>
      </div>
    </div>
  );
}