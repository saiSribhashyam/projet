import { db } from "@/server/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";



const SyncUser= async()=>{
    const {userId}= await auth();
    console.log(userId);
    if(!userId){
        throw new Error("User not found");
    }
    
   

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    if(!user.emailAddresses[0]?.emailAddress)
        return notFound();

    await db.user.upsert({
        where: {
            email: user.emailAddresses[0]?.emailAddress ?? ""
        },
        update:{
            // Add fields to update here
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        create: {
            id: userId,
            email: user.emailAddresses[0]?.emailAddress ?? "",
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            // Add other required fields for user creation here
        }
    })

    return redirect("/dashboard")

    
}

export default SyncUser;