'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useRefetch from '@/hooks/use-refetch'
import { api } from '@/trpc/react'
import { FolderGit2 } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type FormInput={
    repoUrl: string,
    projectName: string,
    githubToken ?: string,
}

const CreatePage = () => {

    const {register, handleSubmit, reset}= useForm<FormInput>();
    const createProject= api.project.createProject.useMutation();
    const refetch=useRefetch();


    function onSubmit(data: FormInput){
        createProject.mutate({
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken

        },{
            onSuccess:()=>{
                toast.success("Project created successfully")
                refetch()
                reset()
            },
            onError:()=>{
                toast.error("Failed to create project")
            }
        })
        return true;

    }

  return (
    <div className='flex items-center gap-12 h-full justify-center'>
        <img src='/undraw_add-notes_9xls.svg' alt='img' className='h-56 w-auto'></img>
        <div>
            <div>
                <h1 className='font-semibold text-2xl flex items-center '>
                    Link GitHub Repo<FolderGit2 className='ml-2'></FolderGit2>
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Link your GitHub repository to create a new project on Projet
                </p>
            </div>
            <div className='h-4'></div>
            <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input {...register('projectName', {required:true})} placeholder="Project Name" required>
                    </Input>
                    <div className='h-2'></div>
                    <Input {...register('repoUrl', {required:true})} placeholder="GitHub URL" type='url' required>
                    </Input>
                    <div className='h-2'></div>
                    <Input {...register('githubToken')} placeholder="GitHub Token (Optional)">
                    </Input>
                    <div className='h-2'></div>
                    <Button type='submit' disabled={createProject.isPending}>Add Project</Button>
                </form>
                

            </div>
        </div>

    </div>
  )
}

export default CreatePage