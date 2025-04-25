'use server'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from '@/server/db'

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY
})

export async function askQuestion(question: string, projectId: string) {
    const stream = createStreamableValue()

    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(',')}]`
    const result = await db.$queryRaw`
    SELECT "fileName","sourceCode","summary",
    1-("summaryEmbedding" <=> ${vectorQuery}::vector) as similarity
    FROM "SourceCodeEmbedding"
    WHERE 1-("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT 10
    ` as { fileName: string, sourceCode: string, summary: string }[]

    // Fetch all file names for the project to include in the file structure
    const fileStructure = await db.sourceCodeEmbedding.findMany({
        where: { projectId },
        select: { fileName: true },
    })

    let context = ''

    // Add file structure to the context
    context += 'The files in the project are:\n'
    for (const file of fileStructure) {
        context += `- ${file.fileName}\n`
    }
    context += '\n'

    // Add relevant files and their content to the context
    for (const doc of result) {
        context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\nsummary: ${doc.summary}\n\n`
    }

    (async () => {
        const { textStream } = await streamText({
            model: google('gemini-1.5-flash'),
            prompt: `
      You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is learning the codebase. This AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and it is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in its brain and is able to accurately answer nearly any question about any topic.
      If the question is asking about code or a specific file, AI will provide the detailed answer, giving step-by-step instructions.
      
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      
      START QUESTION
      ${question}
      END OF QUESTION
      
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to the question, the AI assistant will say, "I'm sorry, but I don't know the answer.", But tries to explain the context with given summaries,filestructures etc.
      AI assistant will not apologize for previous responses but instead will indicate new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, making sure the explanation is not overly brief.
      If there is no file that matches the question, the AI will say, "I'm sorry, but there is no file that matches the question."
      If there is nothing provided in the context, the AI will try to respond based on the question and the file structure of the project.
      If the question is a generalized question like about technology or general information, the AI will answer it based on its knowledge and the context provided.
      `
        })

        for await (const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
    })()

    return {
        output: stream.value,
        filesReferences: result,
    }
}