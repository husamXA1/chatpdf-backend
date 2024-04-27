import {
  RunnableSequence,
  RunnablePassthrough
} from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { Chat_google } from '../models/Cmodels.js';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { combine, retrevire } from './retriver.js';
import { createInterface } from 'readline';

const llm = Chat_google();

const stand_alone_template =
  'given a question generate a stand alone question: {question} standalone question:';

const ans_template = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the provided context.
If the answer isn't in context, please make up an answer that makes sense and mention that it's not from the context.
Please avoid making up an answer. Always speak as if you were chatting with a friend.

Context: {context}
Question: {question}
Answer:
`;

const stand_alone_prompt = PromptTemplate.fromTemplate(stand_alone_template);

const ans_prompt = PromptTemplate.fromTemplate(ans_template);

const stand_alone_chain = RunnableSequence.from([
  // @ts-ignore
  stand_alone_prompt,
  llm,
  new StringOutputParser()
]);

// @ts-ignore
const retrevire_chain = RunnableSequence.from([
  (prevResult) => prevResult.stand_alone,
  retrevire,
  // (prevResult) => console.log(prevResult),
  combine
]);

const answer_chain = RunnableSequence.from([
  // @ts-ignore
  ans_prompt,
  llm,
  new StringOutputParser()
]);

// @ts-ignore
const chain = RunnableSequence.from([
  { stand_alone: stand_alone_chain, original_input: new RunnablePassthrough() },
  {
    context: retrevire_chain,
    question: ({ original_input }) => original_input.question
  },
  answer_chain
]);

// const response = await chain.invoke({
//   question: 'what im i going to learn ? will it be useful?'
// });

// console.log(response);
export const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function ask() {
  rl.question('You: ', async (msg) => {
    if (msg.toLocaleLowerCase() === 'exit') rl.close();
    else {
      const response = await chain.invoke({
        question: msg
      });
      console.log('\x1b[32m%s\x1b[0m', response); // Print response in green
      ask();
    }
  });
}

ask();
