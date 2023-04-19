import React, {useEffect, useMemo, useRef, useState} from "react";
import {Message} from "@/src/types";
import {Props} from "@/src/Block";
import {IconButton, Checkbox} from "@mui/material";

import VoiceOverOffIcon from "@mui/icons-material/VoiceOverOff";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import {useTranslation} from "react-i18next";
import {bool} from "prop-types";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleFilledWhiteOutlinedIcon from "@mui/icons-material/PlayCircleFilledWhiteOutlined";
import {booleanLiteral} from "@babel/types";
// import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
// import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';

const MicRecorder = require('mic-recorder-to-mp3');
// interface SpeechControlUnitBProps {
//     isSpeaking:boolean
// }
// declare let SpeechControlUnitA: React.ComponentType<SpeechControlUnitBProps>;
// declare const SpeechControlUnitB: React.ComponentType<SpeechControlUnitBProps>;
let currentMediaRecorder: any = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentIndex: string = "-1";
let synth:any=null;
// @ts-ignore
if (typeof window.cordova !== "undefined" || typeof window.PhoneGap !== "undefined") {
    // 在 Cordova 环境下执行的代码
//  synth = window.speechSynthesis;
} else {
    if(typeof window.speechSynthesis !== "undefined") {
        void 0;
        synth = window.speechSynthesis;
    }
}

let autoSpeedBuffer: Array<string> = new Array<string>();
let autoSpeedNumber: number = 0
let isRecording: boolean = false;
let speech='';
let autoSpeech = false;
let globalSpeaking= true;
const globalSpeakingEvent = new CustomEvent('SpeakingChange', {
    detail: {
        message: 'SpeakingChange'
    }
});
function setGlobalSpeaking(isSpeaking:boolean){
    globalSpeaking=isSpeaking;
    document.dispatchEvent(globalSpeakingEvent);
}

function blobPartToArrayBuffer(blobParts: BlobPart[]) {
    return new Promise((resolve, reject) => {
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

function stopPlay(){
    if(currentUtterance!=null||synth.speaking){
        synth.cancel();
        currentUtterance=null;
    }
}
function  stopAutoPlay() {
    stopPlay()
    autoSpeedBuffer.length = 0
    window.cancelAnimationFrame(autoSpeedNumber)
    autoSpeedNumber = 0;
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
    let filename: string = dateStr + '.mp3'; //options.defaultPath;
    // console.log('Selected file:', filename);
    if (currentMediaRecorder != null) {
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
            currentMediaRecorder = null;
        }).catch((e: any) => {
            alert('We could not retrieve your message');
            // console.log(e.message);
        });
    }
    isRecording = false;
}

function record_start() {
    isRecording = true
    // New instance
    if (currentMediaRecorder == null) {
        currentMediaRecorder = new MicRecorder({
            bitRate: 128
        });
    }
    currentMediaRecorder.start().then(() => {
        // something else
    }).catch((e: any) => {
        isRecording = false;
        console.error(e.message);
    });
}

export function pushToAutoSpeedBuffer(text: string) {
    autoSpeedBuffer.push(text)
}
function Control(props: {
    unitType: string
    msg: Message | null
    speech: string
    autoSpeech?: boolean
}) {
    const {t} = useTranslation()
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [unitType, setUnitType] = useState(props.unitType)
    const [speech, setSpeech] = useState(props.speech);
    const [autoSpeech, setAutoSpeech] = useState(props.autoSpeech);
    const [checked, setChecked] = useState(false);
    const {msg} = props;
    const refIsSpeaking = useRef({
        updateIsSpeaking: (state: boolean) => {
            setIsSpeaking(state);
            setUnitType(unitType)
        }
    });
    // useEffect(() => {
    //     // 在组件渲染完毕后获取所有子组件的 DOM 元素
    //     console.log('组件渲染完毕')
    // });
    // const MemoizedComponentA = React.memo(SpeechControlUnitA);
    return
    // <>
    //     <SpeechControlUnitA unitType={unitType} isSpeaking={isSpeaking} speechControl={speechControl}/>
    //     <SpeechControlUnitB
    //         unitType={unitType}
    //         isSpeaking={isSpeaking}
    //         speech={speech}
    //         autoSpeech={autoSpeech}
    //         msg={msg} checked={false}
    //         handleSpeech={handleSpeech}
    //         setChecked={(checked: boolean) => {
    //         }}
    //     />
    // </>

}
const saveRecording = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute("style", "display: none")
    // a.style = 'display: none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};
function synth_cancel(msg: string | Message): boolean {
    if (currentUtterance && currentIndex !== "-1") {
        synth.cancel();
        // setIsSpeaking(false)
        record_stop()
        if (typeof msg !== 'string') {
            if (msg.id === currentIndex) {
                currentUtterance = null;
                currentIndex = "-1";
            }
        }
        return true;
    }
    return false;
}
function preSay(msg: string | Message, speech: string | null): SpeechSynthesisUtterance | null {
    // const { msg } = props;
    // const { speech } = props;
    if (synth_cancel(msg)) return null;
    let txt = ""
    if (typeof msg !== 'string') {
        txt = msg.content?.trim() || ''
    } else {
        txt = msg
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
    utterance.voice = voice ? voice : null;
    if (typeof msg !== 'string') {
        currentIndex = msg.id;
    }
    return utterance;
}
const handleSpeech = (isSpeaking:boolean,
                      checked:boolean,
                      msg: Message,
                      speech: string | null,
                      setIsSpeaking:(arg0: boolean)=>void
) => {
    if (autoSpeedBuffer == null) return;
    autoSpeedBuffer.length = 0;
    const utterance = preSay(msg, speech);
    if (utterance === null) {
        setIsSpeaking(false);
        return;
    }

    if (checked) {
        record_start();
        setIsSpeaking(true);
        synth.speak(utterance);
        currentUtterance = utterance;
        currentIndex = msg.id;
    } else {
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
    // utterance.lang = voice.lang;
    // utterance.volume = 1;
    // utterance.rate = 0.8;
    // utterance.pitch = 1;
};
const newHandleSpeech= (isSpeaking:boolean,
                        checked:boolean,
                        msg: Message,
                        speech: string | null,
                        setIsSpeaking:(arg0: boolean)=>void
) => {
    if (globalSpeaking && (!synth.speaking)) {
        setGlobalSpeaking(!globalSpeaking);
        stopAutoPlay()
        if (currentMediaRecorder)
            record_stop();
    }
    if (!isSpeaking) {
        if (checked)record_start();
        // const regex = /<=(？|！|：|。|\n|\([a-zA-Z]\)\(?=[;\?.!:]\))/g
        const strArray = msg.content.split(/<=(？|！|：|。|\n|\([a-zA-Z]\)\(?=[;\?.!:]\))/g)
        strArray.map((str) => pushToAutoSpeedBuffer(str))
    }
    autoSpeechControl()
    currentIndex = msg.id;
};

const autoSay = (msg: string | Message, speech: string | null) => {
    // console.log("准备开始自动朗读。更改状态为 true。");
    setGlobalSpeaking(true);
    const utterance = preSay(msg, speech);
    if (utterance === null) {
        // console.log("无法朗读 utterance is null! 更改状态为 false。");
        // setIsSpeaking(false);
        // refIsSpeaking.current.updateIsSpeaking(false);
        return;
    }
    synth.speak(utterance);
    setGlobalSpeaking(true);
    currentUtterance = utterance;
    if (typeof msg !== 'string') {
        currentIndex = msg.id;
    }
    utterance.onerror = () => {
        if (currentMediaRecorder)
            currentMediaRecorder.stop();
        currentMediaRecorder = null;
        currentUtterance = null;
        currentIndex = "-1";
        // console.log("朗读发生错误了。更改状态为 false。");
        setGlobalSpeaking(false);
    }
    utterance.onend = () => {
        if (currentMediaRecorder && autoSpeedBuffer.length<1)record_stop();
        // if (currentMediaRecorder)
        //     currentMediaRecorder.stop();
        // console.log("朗读结束了。更改状态为 false。");
        currentMediaRecorder = null;
        setGlobalSpeaking(false);
        currentUtterance = null;
        currentIndex = "-1";
    }
}
const autoSpeed = (time: DOMHighResTimeStamp) => {
    if (!synth.speaking
        && autoSpeedBuffer != null
        && autoSpeedBuffer.length > 0
        && autoSpeech
    ) {
        // console.log('调用 autoSay 了')
        // setIsSpeaking(true)
        autoSay(autoSpeedBuffer.shift() as string, speech);
    }

    // console.log('无差别调用 autoSay 了')
    autoSpeedNumber = window.requestAnimationFrame(autoSpeed);
}

const autoSpeedStart=(
)=>{
    // @ts-ignore
    if (typeof window.cordova !== "undefined" || typeof window.PhoneGap !== "undefined") {
        // 在 Cordova 环境下执行的代码
        return;
    }
    if (autoSpeedNumber < 1 && autoSpeech) {
        setGlobalSpeaking(true)
        // isAutoSpeechStarted=true
        // console.log('default 启动autoSpeed')
        autoSpeedNumber = window.requestAnimationFrame(autoSpeed);//default 启动autoSpeed
    }
}
const autoSpeechControl = () => {
    globalSpeaking=!globalSpeaking
    if (!globalSpeaking) {
        synth.pending
        setGlobalSpeaking(globalSpeaking);
        stopAutoPlay()
        if (currentMediaRecorder)
            record_stop();
        return
    }
    if (autoSpeedNumber < 1) {
        setGlobalSpeaking(true)
        autoSpeedNumber = window.requestAnimationFrame(autoSpeed)
        return
    }
    //||
    setGlobalSpeaking(true);
    // autoSpeedNumber = window.requestAnimationFrame(autoSpeed)
    //继续朗读
}
let isAutoSpeechStarted:boolean=false
const AutoSpeechControlUnit = (props: {
    speech: string,
    autoSpeech: boolean
}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    function handleGlobalVariableChange() {
        setIsSpeaking(globalSpeaking);
    }
    useEffect(() => {
        autoSpeech=props.autoSpeech;
        speech=props.speech;
        autoSpeedStart();
        document.addEventListener('SpeakingChange', handleGlobalVariableChange);

        return () => document.removeEventListener('SpeakingChange', handleGlobalVariableChange);
    }, []);
    useEffect(() => {
        speech=props.speech;
        autoSpeech=props.autoSpeech;
    }, [props.speech,props.autoSpeech]);
    return (
        <IconButton size='large' color='primary' onClick={() => autoSpeechControl()}>
            {isSpeaking ? (
                <PauseCircleOutlineOutlinedIcon/>
            ) : (
                <PlayCircleFilledWhiteOutlinedIcon/>
            )}
        </IconButton>
    )
}
const Say =(
    props: {
    // unitType: string,
    // isSpeaking: boolean
    msg: Message | null,
    speech: string,
    autoSpeech: boolean
    // autoSpeech?: boolean,
    // checked?: boolean,
    // handleSpeech(msg: Message | null, speech: string): void,
    // setChecked(checked: boolean): void,
        }
) => {
    const {t} = useTranslation()
    const [checked,setChecked]= useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    function handleGlobalVariableChange() {
        setIsSpeaking(globalSpeaking);
    }
    useEffect(() => {
        autoSpeech=props.autoSpeech;
        speech=props.speech;
        autoSpeedStart();
        document.addEventListener('SpeakingChange', handleGlobalVariableChange);

        return () => document.removeEventListener('SpeakingChange', handleGlobalVariableChange);
    }, []);
    useEffect(() => {
        speech=props.speech;
        autoSpeech=props.autoSpeech;
    }, [props.speech,props.autoSpeech]);
    return (
        isSpeaking
            ? (
                <IconButton onClick={() => {
                    (props.msg != null) && newHandleSpeech(isSpeaking,checked,props.msg, props.speech,setIsSpeaking)
                }} size='large' color='primary'>
                    <VoiceOverOffIcon fontSize='small'/>
                </IconButton>)
            : (
                <>
                    <IconButton onClick={() => {
                        (props.msg != null) && newHandleSpeech(isSpeaking,checked,props.msg, props.speech,setIsSpeaking)
                    }} size='large' color='primary'>
                        <RecordVoiceOverIcon fontSize='small'/>
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
export default function (): void {
    return
}
export {Say, AutoSpeechControlUnit}