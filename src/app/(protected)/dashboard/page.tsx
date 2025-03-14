'use client'
import React from "react";
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import useProject from "@/hooks/use-project";
import { ExternalLink, GithubIcon } from "lucide-react";
import Link from "next/link";


const dashboard = () => {
    const {user}=useUser()
    const {project}=useProject()
    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-y-4">
                {/* github link */}
                <div className="w-fit rounded-md bg-primary px-4 py-3">
                    <div className="flex items-center">
                    <GithubIcon className="size-4 text-white"></GithubIcon>
                    <div className="ml-2">
                        <p className="text-sm font-medium text-white">
                        This project is linked to {' '}
                        <Link href={project?.githubUrl ?? ''} className="inline-flex items-center text-white/80 hover:underline">
                        {project?.githubUrl}
                        <ExternalLink className="ml-1 size-4" />
                        </Link>
                        </p>
                    </div>

                </div>

            
            </div>
            
            
            <div className="h-4"></div>

            <div className="flex items-center gap-4">
                {/* team */} 
                team mem
                invite button
                archive button
            </div>
            </div>

            <div className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 ">
                    AskQuestion
                    MeetingCard
                </div>
            </div>

            <div className="mt-8"></div>
            commitLog
            
        </div>
    );
}

export default dashboard;