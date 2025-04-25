import {GoogleGenerativeAI} from "@google/generative-ai";
import {Document} from "@langchain/core/documents"

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model= genAi.getGenerativeModel({
    model:"gemini-1.5-flash",

})

export const aiSummariseCommit = async (diff: string) => {
    // https://github.com/docker/genai-stack/commit/<commithash>.diff
    const response = await model.generateContent([
      `You are an expert programmer, and you are trying to summarize a git diff.
  Reminders about the git diff format:
  For every file, there are a few metadata lines, like (for example):
  diff --git a/lib/index.js b/lib/index.js
  index aadf601..bfef603 100644
  --- a/lib/index.js
  +++ b/lib/index.js
  \`\`\`
  This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
  Then there is a specifier of the lines that were modified.
  A line starting with \`+\` means it was added.
  A line that starting with \`-\` means that line was deleted.
  A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
  It is not part of the diff.
  [...]
  
  EXAMPLE SUMMARY COMMENTS:
  \`\`\`
  * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
  * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
  * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
  * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
  * Lowered numeric tolerance for test files
  \`\`\`
  Most commits will have less comments than this examples list.
  The last comment does not include the file names,
  because there were more than two relevant files in the hypothetical commit.
  Do not include parts of the example in your summary.
  It is given only as an example of appropriate comments.`,
      `Please summarise the following diff file: \n\n${diff}`,
    ]);
    
    return response.response.text();
  }

  const API_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY2]; // Add more keys if needed
  let apiIndex = 0;
  
  function getApiKey() {
      const key = API_KEYS[apiIndex];
      apiIndex = (apiIndex + 1) % API_KEYS.length; // Rotate API keys
      return key;
  }

  export async function summariseCode(doc: Document) {
    try {
      console.log("Generating summary for", doc.metadata.source);
      const code = doc.pageContent.slice(0, 10000); // Limit input size

      const prompt = `
      You are a senior software engineer helping a junior developer understand a codebase.
      Explain the purpose and functionality of the file: ${doc.metadata.source}.
      
      Code:
      ---
      ${code}
      ---
      
      Provide a clear and concise summary (detailed Summary), covering:
      - The file's purpose.
      - Key functionalities.
      - Important concepts or patterns used.
      `;

      const apiKey = getApiKey(); // Get a rotated API key
      if(!apiKey) throw new Error("No API key found");
      genAi.apiKey = apiKey; // Set the API key on the genAi instance
      const response = await model.generateContent([prompt]);

      return response.response.text();
  } catch (error) {
      console.error("Error in summariseCode", error);
      return "Error in summariseCode";
  }
  }


  export async function generateEmbedding(summary: string){
    const model = genAi.getGenerativeModel({
      model:"text-embedding-004",
    })

    const result = await model.embedContent(summary)
    const embedding= result.embedding

    return embedding.values
  }



  



  