import { createClient } from "@supabase/supabase-js"

const url = "https://zysukkwbipelvzluayki.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3Vra3diaXBlbHZ6bHVheWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDk0OTQsImV4cCI6MjA3MjI4NTQ5NH0.bBufV7qUXfqdImGjLoowhM0RYvilhIk2k75wvFhRJ1c"

const supabase = createClient(url,key)

export default function mediaUpload(file){

    const mediaUploadPromise = new Promise(
        (resolve, reject)=>{

            if(file == null){
                reject("No file selected")
                return
            }

            const timestamp = new Date().getTime()
            const newName = timestamp+file.name

            supabase.storage.from("buynest").upload(newName, file, {
                upsert:false,
                cacheControl:"3600"
            }).then(()=>{
                const publicUrl = supabase.storage.from("buynest").getPublicUrl(newName).data.publicUrl
                resolve(publicUrl)
            }).catch(
                ()=>{
                    reject("Error occured in supabase connection")
                }
            )
        }
    )

    return mediaUploadPromise

}


