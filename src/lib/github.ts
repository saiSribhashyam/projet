import { db } from '@/server/db';
import {Octokit} from 'octokit';
import axios from 'axios';
import { aiSummariseCommit } from './gemini';

export const octokit= new Octokit({
    auth: process.env.GITHUB_TOKEN,
    

})



type Response={
     commitHash: string,
     commitMessage: string,
     commitAuthor: string,
     commitAuthorAvatar: string,
     commitDate: string,

}

export const getCommitHashes = async (githubUrl: string) : Promise<Response[]>=>{
    const cleanedUrl = githubUrl.endsWith('.git') ? githubUrl.slice(0, -4) : githubUrl;
    const [owner, repo] = cleanedUrl.split('/').slice(-2);
    
    if(!owner || !repo){
        throw new Error('Invalid github url')
    }

    const {data} = await octokit.rest.repos.listCommits({
        owner,
        repo
    })


    const sortedCommits = data.sort((a : any,b: any)=>new Date(b.commit.author.date).getTime()- new Date(a.commit.author.date).getTime()) as any[]

    return sortedCommits.slice(0,10).map((commit: any)=>({
        commitHash: commit.sha as string,
        commitMessage: commit.commit.message ?? "",
        commitAuthor: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit?.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? "",
    }))
}

export const pollCommits = async (projectId: string)=>{
    const {project, githubUrl} = await fetchProjectGithubUrl(projectId)
    const commitHashes = await getCommitHashes(githubUrl)
    const unprocessedCommits= await filterUnprocessedCommits(projectId,commitHashes)
    const summarisedResponses = await Promise.allSettled(unprocessedCommits.map(commit=>{
        return summariseCommit(githubUrl,commit.commitHash)
    }))

    const summaries= summarisedResponses.map((response)=>{
        if(response.status === 'fulfilled'){
            return response.value as string
        }
        return ""
    })
    
    const commits = await db.commit.createMany({
        data: summaries.map((summary,index)=> {
            return{
                projectId: projectId,
                commitHash: unprocessedCommits[index]!.commitHash,
                commitMessage: unprocessedCommits[index]!.commitMessage,
                commitAuthor: unprocessedCommits[index]!.commitAuthor,
                commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                commitDate: unprocessedCommits[index]!.commitDate,
                summary
            }
        })
    })

    return commits

}

async function fetchProjectGithubUrl(projectId: string){
    const project= await db.project.findUnique({
        where: {id: projectId},
        select: {githubUrl: true},
    })

    if (!project?.githubUrl){
        throw new Error('Project does not have a github url')
    }

    return {project, githubUrl: project?.githubUrl}
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]){
    const processedCommitHashes = await db.commit.findMany({
        where:  {projectId},

    })

    const unprocessedCommits= commitHashes.filter((commit)=> !processedCommitHashes.some((processedCommit)=> processedCommit.commitHash===commit.commitHash)) 
    return unprocessedCommits
}

async function summariseCommit(githubUrl: string, commitHash: string){
    const cleanedUrl = githubUrl.endsWith('.git') ? githubUrl.slice(0, -4) : githubUrl;
    const {data} = await axios.get(`${cleanedUrl}/commit/${commitHash}.diff`,{
        headers:{
            Accept:'application/vnd.github.v3.diff'
        }
    })

    return await aiSummariseCommit(data) || ""

}

// await pollCommits('cm87j12ou0000v730ql5opftu').then(console.log)