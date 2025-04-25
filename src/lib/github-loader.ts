import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
import { Document } from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '@/server/db';

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const branches = ['master', 'main']; // Try both master and main branches
    let docs: Document[] = [];

    for (const branch of branches) {
        try {
            const loader = new GithubRepoLoader(githubUrl, {
                accessToken: githubToken || '',
                branch,
                ignoreFiles: [
                    // Dependency lock files
                    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',

                    // Node modules and build artifacts
                    'node_modules/', 'dist/', 'out/', 'build/', '.parcel-cache/', '.turbo/', '.next/', '.vite/',

                    // Logs and cache
                    'npm-debug.log', 'yarn-error.log', 'pnpm-debug.log', 'debug.log', 'logs/', '.cache/',

                    // Editor and IDE files
                    '.vscode/', '.idea/', '*.iml', '.DS_Store', 'Thumbs.db', 'db.sqlite3', 'manage.py', '.idea/',

                    // Git and version control files
                    '.git/', '.gitignore', '.gitattributes',

                    // Testing and coverage reports
                    'coverage/', 'jest.config.js', 'jest.config.ts', '.nyc_output/',

                    // Python-specific ignored files
                    '__pycache__/', '.pytest_cache/', '.mypy_cache/', 'venv/', 'pip-wheel-metadata/', 'Pipfile.lock',

                    // Java and Kotlin (Android) specific
                    'target/', '.gradle/', 'build.gradle.kts', 'gradle.properties',

                    // C/C++ and Rust
                    '*.o', '*.a', '*.so', '*.exe', '*.dll', 'Cargo.lock', 'target/',

                    // Docker and CI/CD (excluding Dockerfile)
                    '.dockerignore', '.circleci/', '.gitlab-ci.yml',

                    // Miscellaneous
                    'CMakeCache.txt', 'Makefile',
                ],
                recursive: true,
                unknown: 'warn',
                maxConcurrency: 5,
            });

            docs = await loader.load();
            console.log(`Successfully loaded branch: ${branch}`);
            break; // Exit the loop if successful
        } catch (error) {
            console.warn(`Failed to load branch: ${branch}. Trying the next branch...`);
        }
    }

    if (docs.length === 0) {
        throw new Error('Failed to load repository. Neither master nor main branch could be loaded.');
    }

    return docs;
};

// Example usage
// console.log(await loadGithubRepo("https://github.com/saiSribhashyam/smartCalc-backend"));

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);

    await Promise.allSettled(
        allEmbeddings.map(async (embedding, index) => {
            console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);
            if (!embedding) return;

            const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                data: {
                    summary: embedding.summary,
                    sourceCode: embedding.sourceCode,
                    fileName: embedding.fileName,
                    projectId,
                },
            });

            await db.$executeRaw`
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${embedding.embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id}
            `;
        })
    );
};

// const generateEmbeddings = async (docs: Document[]) => {
//     return await Promise.all(
//         docs.map(async (doc) => {
//             const summary = await summariseCode(doc);
//             const embedding = await generateEmbedding(summary);
//             return {
//                 summary,
//                 embedding,
//                 sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
//                 fileName: doc.metadata.source,
//             };
//         })
//     );
// };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const generateEmbeddings = async (docs: Document[]) => {
    const results = [];

    for (let i = 0; i < docs.length; i++) {
        if (i % 7 === 0 && i !== 0) {
            console.log("Pausing for rate limit...");
            await delay(2000); // Pause every 5 requests to avoid overload
        }

        const doc = docs[i];
        if (!doc) {
            console.warn("Skipping undefined document");
            continue;
        }
        const summary = await summariseCode(doc);
        const embedding = await generateEmbedding(summary);

        results.push({
            summary,
            embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source,
        });
    }

    return results;
};