import {useState} from "react";
import {Message} from "@/src/types";
import {Props} from "@/src/Block";
import {IconButton,Checkbox} from "@mui/material";

import VoiceOverOffIcon from "@mui/icons-material/VoiceOverOff";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import {useTranslation} from "react-i18next";
import {bool} from "prop-types";
const MicRecorder = require('mic-recorder-to-mp3');

let currentMediaRecorder : any = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentIndex: string = "-1";
const synth = window.speechSynthesis;

let isSpeaking:boolean=false;
let isRecording:boolean=false;
function blobPartToArrayBuffer(blobParts:BlobPart[]) {
    return new Promise ((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            resolve(fileReader.result);
        };
        fileReader.onerror = () => {
            reject(fileReader.error);
        };
        fileReader.readAsArrayBuffer(new Blob(blobParts));
    });
}

function record_stop() {
    const date = new Date();
    const formats = {
        yyyy: date.getFullYear(),
        M: date.getMonth() + 1,
        d: date.getDate(),
        HH: date.getHours(),
        mm: date.getMinutes(),
        ss: date.getSeconds(),
        // SSS:date.getMilliseconds()
    };
    let dateStr = `${formats.yyyy}${formats.M}${formats.d}${formats.HH}${formats.mm}${formats.ss}`;
    let filename: string=dateStr+'.mp3'; //options.defaultPath;
    console.log('Selected file:', filename);
    if(currentMediaRecorder!=null) {
        currentMediaRecorder
            .stop()
            .getMp3().then((data: any) => {
            // do what ever you want with buffer and blob
            // Example: Create a mp3 file and play
            // const file = new File(data[0] as BlobPart[], filename, {
            //     lastModified: Date.now()
            // });
            let url = URL.createObjectURL(data[1] as Blob)
            // const player = new Audio(url);
            // player.play();
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            anchor.click();
            currentMediaRecorder=null;
        }).catch((e: any) => {
            alert('We could not retrieve your message');
            console.log(e.message);
        });
    }
    isRecording = false;
}
function record_start(){
    isRecording=true
    // New instance
    if(currentMediaRecorder==null) {
        currentMediaRecorder = new MicRecorder({
            bitRate: 128
        });
    }
    currentMediaRecorder.start().then(() => {
        // something else
    }).catch((e: any) => {
        isRecording=false;
        console.error(e.message);
    });


}
function synth_cancel(msg:string|Message):boolean{
    if (currentUtterance && currentIndex !== "-1") {
        synth.cancel();
        isSpeaking=false
        record_stop()
        if(typeof msg !== 'string') {
            if (msg.id === currentIndex) {
                currentUtterance = null;
                currentIndex = "-1";
            }
        }
        return true;
    }
    return false;
}

export function IsSpeaking() :boolean{
    return isSpeaking;
}
export function handleSay(msg:string|Message,speech:string|null){
    // const [isSpeaking, setIsSpeaking] = useState(false)
    console.log("准备开始自动朗读。");
    const utterance=presay(msg,speech);
    if(utterance === null){
        console.log("无法朗读 utterance is null!");
        isSpeaking=false;
        // setIsSpeaking(false);
        return;
    }
    synth.speak(utterance);
    isSpeaking=true
    // setIsSpeaking(true);
    currentUtterance = utterance;
    if(typeof msg !== 'string') {
        currentIndex = msg.id;
    }

    utterance.onend = () => {
        if(currentMediaRecorder)
            currentMediaRecorder.stop();
        console.log("朗读结束了。");
        currentMediaRecorder=null;
        isSpeaking=false;
        // setIsSpeaking(false);
        currentUtterance = null;
        currentIndex = "-1";
    }
}
function presay(msg:string|Message,speech:string|null):SpeechSynthesisUtterance|null{
    // const { msg } = props;
    // const { speech } = props;
    if (synth_cancel(msg))return null;
    let txt= ""
    if(typeof msg !== 'string') {
        txt = msg.content?.trim() || ''
    }else{
        txt=msg
    }
    if (!txt) return null;
    const utterance = new SpeechSynthesisUtterance(txt);
    const voices = speechSynthesis.getVoices();
    // "speech_lang": "Microsoft Yaoyao - Chinese (Simplified, PRC)",
    // "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"
    let voice = voices.find(voice => voice.name === speech);
    if (!voice) {
        voice = voices.find(voice => voice.lang === 'zh-CN');
    }
    utterance.voice=voice?voice:null;
    if(typeof msg !== 'string') {
        currentIndex = msg.id;
    }
    return utterance;
}
export function Say(props: Props) {
    const { t } = useTranslation()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [checked, setChecked] = useState(false);
    const { msg,autoSpeedbuffer, speech} = props;

    const handleSpeech = (msg:Message,speech:string|null) => {
        autoSpeedbuffer.length=0;
        const utterance=presay(msg,speech);
        if(utterance === null){
            setIsSpeaking(false);
            return;
        }
        // utterance.lang = voice.lang;
        // utterance.volume = 1;
        // utterance.rate = 0.8;
        // utterance.pitch = 1;
        if(checked) {
            record_start();
            setIsSpeaking(true);
            synth.speak(utterance);
            currentUtterance = utterance;
            currentIndex = msg.id;
        }else{
            synth.speak(utterance);
            setIsSpeaking(true);
            currentUtterance = utterance;
            currentIndex = msg.id;
        }
        utterance.onend = () => {
            record_stop()
            setIsSpeaking(false);
            currentUtterance = null;
            currentIndex = "-1";
        }
    };
    const saveRecording=(blob:Blob, filename:string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute("style","display: none")
        // a.style = 'display: none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        isSpeaking
        ?(
            <IconButton onClick={()=> {
                handleSpeech(msg,speech)
            }} size='large' color='primary'>
                <VoiceOverOffIcon fontSize='small' />
            </IconButton>)
        : (
            <>
                <IconButton onClick={()=>{
                    handleSpeech(msg,speech)
                }} size='large' color='primary'>
                    <RecordVoiceOverIcon fontSize='small' />
                </IconButton>
                <Checkbox
                    checked={checked}
                    onChange={(event) => {
                        setChecked(event.target.checked);
                    }
                }
                    title={t('save audio to file') as string}
                />
            </>
        )
    );
}
