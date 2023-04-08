import {useState} from "react";
import {Message} from "@/src/types";
import {Props} from "@/src/Block";
import {IconButton,Checkbox} from "@mui/material";

import VoiceOverOffIcon from "@mui/icons-material/VoiceOverOff";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import {useTranslation} from "react-i18next";
import {bool} from "prop-types";

let currentmediaRecorder : MediaRecorder | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentIndex: string = "-1";
const synth = window.speechSynthesis;

let isSpeaking:boolean=false;
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
function synth_cancel(msg:string|Message):boolean{
    if (currentUtterance && currentIndex !== "-1") {
        synth.cancel();
        isSpeaking=false
        if(currentmediaRecorder)currentmediaRecorder.stop();
        currentmediaRecorder=null;
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
        if(currentmediaRecorder)
            currentmediaRecorder.stop();
        console.log("朗读结束了。");
        currentmediaRecorder=null;
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
    const { msg } = props;
    const { speech } = props;

    const handleSay = (msg:Message,speech:string|null) => {
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
            audioSave().then(() => {
                synth.speak(utterance);
                setIsSpeaking(true);
                currentUtterance = utterance;
                currentIndex = msg.id;
            });
        }else{
            synth.speak(utterance);
            setIsSpeaking(true);
            currentUtterance = utterance;
            currentIndex = msg.id;
        }
        utterance.onend = () => {
            if(currentmediaRecorder)
                currentmediaRecorder.stop();
            currentmediaRecorder=null;
            setIsSpeaking(false);
            currentUtterance = null;
            currentIndex = "-1";
        }
    };
    const audioSave = async () => {
        const options = {
            defaultPath: 'audio.mp3',
            filters: [{name: 'Audio Files', extensions: ['mp3']}]
        };
        let filename: string= options.defaultPath;
        // filename = await dialog.save(options) as string;
        console.log('Selected file:', filename);
        const constraints = {audio: true};
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const chunks: BlobPart[] | undefined = [];
                const mediaRecorder = new MediaRecorder(stream);
                currentmediaRecorder = mediaRecorder;
                mediaRecorder.addEventListener('dataavailable', event => {
                    chunks.push(event.data);
                });

                mediaRecorder.addEventListener('stop', () => {
                    stream.getTracks().forEach(track => track.stop());
                    if(filename!=null) {
                        blobPartToArrayBuffer(chunks).then((data)=> {
                            // taurifs.writeBinaryFile(filename,
                            //     data as ArrayBuffer);
                        });
                    }
                });
                mediaRecorder.start();
                setTimeout(() => {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(track => track.stop());
                }, 1000*60*10);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        isSpeaking
        ?(
            <IconButton onClick={()=> {
                handleSay(msg,speech)
            }} size='large' color='primary'>
                <VoiceOverOffIcon fontSize='small' />
            </IconButton>)
        : (
            <>
                <IconButton onClick={()=>{
                    handleSay(msg,speech)
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
