'use client'

import MDEditor from '@uiw/react-md-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import Image from 'next/image'
import React from 'react'
import { askQuestion } from './actions'
import { readStreamableValue } from 'ai/rsc'
import CodeReferences from './code-references'
import ReactMarkdown from 'react-markdown'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import useRefetch from '@/hooks/use-refetch'

const AskQuestionCard = () => {
    const { project } = useProject()
    const [question, setQuestion] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [filesReferences, setFilesReferences] = React.useState<{ fileName: string, sourceCode: string, summary: string }[]>([])
    const [answer, setAnswer] = React.useState('')
    const saveAnswer = api.project.saveAnswer.useMutation()

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setAnswer('')
        setFilesReferences([])
        e.preventDefault()
        if (!project?.id) return
        setLoading(true)

        const { output, filesReferences } = await askQuestion(question, project.id)
        setOpen(true)
        setFilesReferences(filesReferences)

        for await (const delta of readStreamableValue(output)) {
            if (delta) {
                setAnswer(ans => ans + delta)
            }
        }
        setLoading(false)
    }

    const refetch=useRefetch()

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className='sm:max-w-[80vw] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl'>
  <DialogHeader>
    <DialogTitle className='flex items-center gap-2'>
      <Image src='/kitty.png' alt='Logo' width={32} height={32} />
      <span className='text-lg font-semibold'>Answer</span>
      <Button disabled={saveAnswer.isPending} variant={'outline'} onClick={()=>{
        saveAnswer.mutate({
            projectId: project!.id,
            question,
            answer,
            filesReferences
        },{
            onSuccess:()=>{
                toast.success('Answer saved successfully!');
                refetch()
            },
            onError:()=>{
                toast.error('Error saving answer!');
            }
        })
      }}>Save Answer</Button>
    </DialogTitle>
  </DialogHeader>

  <div
    className="prose dark:prose-invert max-w-none text-[0.95rem] leading-7 px-4 py-3 border rounded-md bg-muted/30 backdrop-blur-sm transition-all duration-300 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-md scrollbar-track-transparent"
  >
    <ReactMarkdown>{answer}</ReactMarkdown>
  </div>

  <div className='h-4'></div>

  <CodeReferences fileReferences={filesReferences} />

  <div className="flex justify-end mt-4">
    <Button type='button' onClick={() => setOpen(false)}>Close</Button>
  </div>
</DialogContent>

            </Dialog>

            <Card className='relative col-span-3'>
                <CardHeader>
                    <CardTitle>Ask a question</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea
                            placeholder='Which file should I edit to change the home page'
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <div className='h-4'></div>
                        <Button type='submit' disabled={loading}>
                            {loading ? 'Thinking...' : 'Ask Project!'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard
