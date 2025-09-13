"use client"

import { useState, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Clock,
  Target,
  Play,
  Send,
  Brain,
  CheckCircle,
  Lightbulb,
  Smile,
  Users,
  Briefcase,
  Trophy,
  RefreshCw,
  Loader2,
  Mic,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Settings,
  Check,
  FileText,
} from "lucide-react"
import {
  getRandomQuestions,
  getQuestionCount,
  type Question,
  getQuestionStats,
  getRandomCategoryQuestionsInOrder,
} from "@/lib/questions-service"
import type { AggregatedReport, IndividualEvaluationResponse } from "@/types/evaluation"
import { supabase } from "@/lib/supabase/client"
import LoginPrompt from "@/components/LoginPrompt"

// TypeScript类型定义
declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
    onstart: () => void
    start: () => void
    stop: () => void
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
    currentMediaRecorder: MediaRecorder | null
    currentRecordingStream: MediaStream | null
    currentSpeechRecognition: SpeechRecognition | null
  }

  interface AudioContext {
    animationId?: number
  }
}

// 阶段配置
const stageConfig = {
  hr: {
    title: "HR面 - 职业匹配度与潜力评估",
    description: "评估职业动机、自我认知、沟通协作、职业规划",
    icon: Users,
    color: "blue",
    stageId: 1,
  },
  professional: {
    title: "专业面 - 硬核能力与实践评估",
    description: "评估产品设计思维、技术理解力、商业化能力、数据驱动能力",
    icon: Briefcase,
    color: "green",
    stageId: 2,
  },
  final: {
    title: "终面 - 战略思维与行业洞察评估",
    description: "评估战略思维、行业洞察、商业模式设计、复杂场景分析",
    icon: Trophy,
    color: "purple",
    stageId: 3,
  },
}

// 组件接口定义
interface InterviewPracticeProps {
  moduleType: "hr" | "professional" | "final"
  setModuleType?: (moduleType: "hr" | "professional" | "final") => void
  onBack: () => void
  showSuggestion?: boolean
  setShowSuggestion?: Dispatch<SetStateAction<boolean>>
}

type EvaluationResult = AggregatedReport;

export default function InterviewPractice({ moduleType = "hr", setModuleType, onBack }: InterviewPracticeProps) {
  // 类型检查函数
  const isAggregatedReport = (data: any): data is AggregatedReport => {
    return 'individualEvaluations' in data && 'overallSummary' in data;
  }

  // 状态管理
  const [currentStep, setCurrentStep] = useState<"overview" | "answering" | "analyzing" | "result">("overview")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [skippedQuestions, setSkippedQuestions] = useState<boolean[]>([]) // 跟踪跳过的题目
  
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [stageProgress, setStageProgress] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [totalQuestionsInStage, setTotalQuestionsInStage] = useState(0)
  const [questionStats, setQuestionStats] = useState<{ totalQuestions: number; questionsByStage: any[] }>({
    totalQuestions: 0,
    questionsByStage: [],
  })
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [networkRetryCount, setNetworkRetryCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // 语音合成状态
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [speechVolume, setSpeechVolume] = useState(0.8)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [speechProgress, setSpeechProgress] = useState(0)
  const [showSpeechSettings, setShowSpeechSettings] = useState(false)

  // 设备检测状态
  const [deviceCheckStep, setDeviceCheckStep] = useState<"idle" | "microphone" | "speaker" | "completed">("idle")
  const [microphoneStatus, setMicrophoneStatus] = useState<"unchecked" | "testing" | "success" | "failed">("unchecked")
  const [speakerStatus, setSpeakerStatus] = useState<"unchecked" | "testing" | "success" | "failed">("unchecked")
  const [testRecording, setTestRecording] = useState<Blob | null>(null)
  const [testTranscript, setTestTranscript] = useState("")
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false)
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null)
  
  // 实时音频可视化状态
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioVisualizationContext, setAudioVisualizationContext] = useState<AudioContext | null>(null)
  const [audioVisualizationAnalyser, setAudioVisualizationAnalyser] = useState<AnalyserNode | null>(null)
  const [realTimeAudioLevel, setRealTimeAudioLevel] = useState(0)
  const [isMonitoringAudio, setIsMonitoringAudio] = useState(false)
  const [microphoneTestInProgress, setMicrophoneTestInProgress] = useState(false)
  
  // 用户登录状态
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [availableAudioDevices, setAvailableAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [currentPlayback, setCurrentPlayback] = useState<HTMLAudioElement | null>(null)
  const [speakerTestFailed, setSpeakerTestFailed] = useState(false);

  // 答题录音状态
  const [answerRecordings, setAnswerRecordings] = useState<(Blob | null)[]>([])
  const [answerAudioUrls, setAnswerAudioUrls] = useState<(string | null)[]>([])
  const [isPlayingAnswerAudio, setIsPlayingAnswerAudio] = useState<number | null>(null)
  const [currentAnswerRecorder, setCurrentAnswerRecorder] = useState<MediaRecorder | null>(null)
  const [currentAnswerStream, setCurrentAnswerStream] = useState<MediaStream | null>(null)

  // 练习时长记录
  const [practiceStartTime, setPracticeStartTime] = useState<Date | null>(null)
  
  // 答题建议显示状态
  const [showSuggestion, setShowSuggestion] = useState(false)
  
  // 答题时间限制
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (currentStep === "answering" && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        speakQuestion(currentQuestion.question_text)
      }
    }
  }, [currentQuestionIndex, questions, currentStep])

  const currentStage = stageConfig[moduleType]
  const IconComponent = currentStage.icon

  // 加载题目
  const loadQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      console.log(`🔍 [前端] 开始加载 ${currentStage.title} 的题目，stageId: ${currentStage.stageId}`)

      const [fetchedQuestions, totalCount] = await Promise.all([
        getRandomCategoryQuestionsInOrder(currentStage.stageId),
        getQuestionCount(currentStage.stageId),
      ])

      console.log(
        `📚 [前端] 成功获取 ${fetchedQuestions.length} 道题目:`,
        fetchedQuestions.map((q) => ({
          id: q.id,
          text: q.question_text.substring(0, 50) + "...",
          category_id: q.category_id, // 添加 category_id 到日志中
        })),
      )
      console.log(
        `📊 [前端] 检查所有题目的 Category ID:`,
        fetchedQuestions.map((q) => q.category_id)
      );
      console.log(`📊 [前端] 该阶段题库总数: ${totalCount}`)

      setQuestions(fetchedQuestions)
      setTotalQuestionsInStage(totalCount)

      const stats = await getQuestionStats()
      setQuestionStats(stats)
      console.log(`📊 [前端] 题库统计:`, stats)
    } catch (error) {
      console.error("💥 [前端] 加载题目失败:", error)
      setQuestions([])
      setTotalQuestionsInStage(0)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // 获取可用音频设备
  const getAudioDevices = async () => {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('浏览器不支持音频设备枚举功能')
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      
      if (audioInputs.length === 0) {
        throw new Error('未检测到可用的音频输入设备')
      }
      
      setAvailableAudioDevices(audioInputs)
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId)
      }
    } catch (error) {
      console.error('获取音频设备失败:', error)
      setMicrophoneStatus("failed")
      if (error instanceof Error) {
        setTestTranscript(`设备检测失败: ${error.message}`)
      } else {
        setTestTranscript(`设备检测失败: 发生未知错误`)
      }
    }
  }

  // 开始实时音频监控
  const startAudioMonitoring = async (deviceId?: string) => {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频访问功能，请使用现代浏览器')
      }
      
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('浏览器不支持Web Audio API，无法进行实时音频分析')
      }
      
      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setAudioStream(stream)
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      microphone.connect(analyser)
      
      setAudioVisualizationContext(audioContext)
      setAudioVisualizationAnalyser(analyser)
      setIsMonitoringAudio(true)
      
      // 开始音频级别检测循环
      let isRunning = true
      const detectAudioLevel = () => {
        if (analyser && isRunning) {
          const dataArray = new Uint8Array(analyser.fftSize)
          analyser.getByteTimeDomainData(dataArray)
          
          // 计算RMS音量
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            const value = (dataArray[i] - 128) / 128
            sum += value * value
          }
          const rms = Math.sqrt(sum / dataArray.length)
          const normalizedLevel = Math.min(rms * 10, 1) // 乘以10增加敏感度，限制到1
          
          setRealTimeAudioLevel(normalizedLevel)
          
          const animationId = requestAnimationFrame(detectAudioLevel);
          (audioContext as any).animationId = animationId
        }
      }
      
      detectAudioLevel()
      
      // 保存动画ID和运行状态以便后续取消
      ;(audioContext as any).stopMonitoring = () => {
        isRunning = false
        if ((audioContext as any).animationId) {
          cancelAnimationFrame((audioContext as any).animationId)
        }
      }
      
    } catch (error) {
      console.error('启动音频监控失败:', error)
      setMicrophoneStatus("failed")
      
      // 详细的错误处理
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setTestTranscript('麦克风权限被拒绝，请点击地址栏的麦克风图标允许访问')
        } else if (error.name === 'NotFoundError') {
          setTestTranscript('未找到指定的麦克风设备，请检查设备连接或选择其他设备')
        } else if (error.name === 'NotReadableError') {
          setTestTranscript('麦克风设备被其他应用占用，请关闭其他使用麦克风的程序')
        } else if (error.name === 'OverconstrainedError') {
          setTestTranscript('所选麦克风设备不支持当前配置，请尝试选择其他设备')
        } else {
          setTestTranscript(`音频监控启动失败: ${error.message}`)
        }
      } else {
        setTestTranscript('音频监控启动失败: 发生未知错误')
      }
    }
  }

  // 停止音频监控
  const stopAudioMonitoring = () => {
    setIsMonitoringAudio(false)
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    
    if (audioVisualizationContext) {
      // 停止监控循环
      if ((audioVisualizationContext as any).stopMonitoring) {
        (audioVisualizationContext as any).stopMonitoring()
      }
      audioVisualizationContext.close()
      setAudioVisualizationContext(null)
    }
    
    setAudioVisualizationAnalyser(null)
    setRealTimeAudioLevel(0)
  }

  // 设备检测功能
  const startDeviceCheck = async () => {
    setDeviceCheckStep("microphone")
    setMicrophoneStatus("unchecked")
    setSpeakerStatus("unchecked")
    setTestRecording(null)
    setTestTranscript("")
    setTestAudioUrl(null)
    
    // 获取音频设备列表
    await getAudioDevices()
  }

  const testMicrophone = async () => {
    stopPlayback() // 停止当前播放
    if (microphoneTestInProgress) {
      // 停止测试
      stopMicrophoneTest()
      return
    }
    
    setMicrophoneTestInProgress(true)
    setMicrophoneStatus("testing")
    setTestTranscript("")
    
    try {
      // 开始实时音频监控
      await startAudioMonitoring(selectedAudioDevice)
      
      // 创建录音器
      const constraints = {
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
      }
      const recordingStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // 检查MediaRecorder支持的格式
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      }
      
      const mediaRecorder = new MediaRecorder(recordingStream, { mimeType })
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType })
        setTestRecording(audioBlob)
        
        // 清理之前的URL
        if (testAudioUrl) {
          URL.revokeObjectURL(testAudioUrl)
        }
        
        const audioUrl = URL.createObjectURL(audioBlob)
        setTestAudioUrl(audioUrl)
        
        console.log('录音完成，文件大小:', audioBlob.size, 'bytes，格式:', mimeType)
        
        // 停止录音流
        recordingStream.getTracks().forEach(track => track.stop())
        
        // 检查是否有录音内容
        if (audioBlob.size > 100) { // 至少100字节才认为是有效录音
          setMicrophoneStatus("success")
        } else {
          setMicrophoneStatus("failed")
          setTestTranscript("未检测到有效音频输入，请检查麦克风权限和设备连接")
        }
      }
      
      mediaRecorder.onerror = (event: any) => {
        console.error('录音过程中出错:', event);
        setMicrophoneStatus("failed");
        setTestTranscript("录音过程中出现错误: " + event.error.name);
        recordingStream.getTracks().forEach(track => track.stop())
      }
      
      // 开始录音，每秒收集一次数据
      mediaRecorder.start(1000)
      
      // 保存录音器引用以便停止
      window.currentMediaRecorder = mediaRecorder
      window.currentRecordingStream = recordingStream
      
      // 启动语音识别（可选）
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const testRecognition = new SpeechRecognition()
        
        testRecognition.continuous = true  // 启用连续识别
        testRecognition.interimResults = true
        testRecognition.lang = 'zh-CN'
        
        let finalTranscriptText = ''
        
        testRecognition.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript = transcript
            }
          }
          
          if (finalTranscript) {
            finalTranscriptText += finalTranscript
          }
          
          // 显示最终识别结果 + 当前临时结果
          const displayText = finalTranscriptText + (interimTranscript ? ` [${interimTranscript}]` : '')
          setTestTranscript(displayText || "正在识别...")
        }
        
        testRecognition.onerror = (event) => {
          console.error('语音识别测试错误:', event.error)
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setTestTranscript('语音识别失败: ' + event.error)
          }
        }
        
        testRecognition.onend = () => {
          // 如果测试还在进行中，重新启动识别
          if (microphoneTestInProgress && !finalTranscriptText) {
            try {
              testRecognition.start()
            } catch (error) {
              console.log('重启语音识别失败:', error)
            }
          } else if (!finalTranscriptText) {
            setTestTranscript("未识别到语音内容，但麦克风工作正常")
          }
        }
        
        try {
          testRecognition.start()
          // 保存语音识别引用以便停止
          window.currentSpeechRecognition = testRecognition
        } catch (error) {
          console.error('启动语音识别失败:', error)
        }
      }
      
    } catch (error) {
      console.error('麦克风测试失败:', error)
      setMicrophoneStatus("failed")
      setMicrophoneTestInProgress(false)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setTestTranscript("麦克风权限被拒绝，请允许网站访问麦克风")
        } else if (error.name === 'NotFoundError') {
          setTestTranscript("未找到麦克风设备，请检查设备连接")
        } else {
          setTestTranscript("麦克风测试失败: " + error.message)
        }
      } else {
        setTestTranscript("麦克风测试失败: 发生未知错误")
      }
      
      stopAudioMonitoring()
    }
  }
  
  const stopMicrophoneTest = () => {
    setMicrophoneTestInProgress(false)
    
    // 停止录音
    if (window.currentMediaRecorder && window.currentMediaRecorder.state !== 'inactive') {
      window.currentMediaRecorder.stop()
    }
    
    // 停止录音流
    if (window.currentRecordingStream) {
      window.currentRecordingStream.getTracks().forEach(track => track.stop())
      window.currentRecordingStream = null
    }
    
    // 停止语音识别
    if (window.currentSpeechRecognition) {
      window.currentSpeechRecognition.stop()
      window.currentSpeechRecognition = null
    }
    
    // 停止音频监控
    stopAudioMonitoring()
    
    // 根据测试结果设置状态
    if (testTranscript && testTranscript.trim() !== "正在识别..." && testTranscript.trim() !== "") {
      setMicrophoneStatus("success")
    } else if (realTimeAudioLevel > 0.1) {
      setMicrophoneStatus("success")
      setTestTranscript("检测到音频输入，麦克风工作正常")
    } else {
      setMicrophoneStatus("failed")
      setTestTranscript("未检测到有效的音频输入，请检查麦克风设置")
    }
    
    // 清理全局引用
    window.currentMediaRecorder = null
  }

  const testSpeaker = () => {
    stopAllAudio() // 停止所有音频播放
    setSpeakerStatus("testing")
    setIsPlayingTestAudio(true)
    
    try {
      // 检查浏览器支持
      if (!window.speechSynthesis) {
        throw new Error('浏览器不支持语音合成功能')
      }
      
      // 播放测试音频
      const testText = "这是音响测试，如果您能听到这段话，说明音响工作正常。"
      const utterance = new SpeechSynthesisUtterance(testText)
      utterance.lang = 'zh-CN'
      utterance.rate = 1.0
      utterance.volume = speechVolume
      
      utterance.onend = () => {
        setSpeakerStatus("success")
        setIsPlayingTestAudio(false)
      }
      
      utterance.onerror = (event) => {
        console.error('扬声器测试失败:', event)
        setSpeakerStatus("failed")
        setIsPlayingTestAudio(false)
      }
      
      // 清除之前的语音队列
      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
      
    } catch (error) {
      console.error('扬声器测试启动失败:', error)
      setSpeakerStatus("failed")
      setIsPlayingTestAudio(false)
    }
  }

  const stopPlayback = () => {
    if (currentPlayback) {
      currentPlayback.pause()
      currentPlayback.currentTime = 0
      setCurrentPlayback(null)
      setIsPlayingTestAudio(false)
    }
  }

  const playTestRecording = () => {
    if (testRecording && testAudioUrl) {
      stopAllAudio() // 停止所有音频播放
      
      try {
        const audio = new Audio(testAudioUrl)
        
        // 设置音频属性以提高播放质量
        audio.preload = 'auto'
        audio.volume = 0.8
        audio.controls = false
        
        audio.onended = () => {
          setIsPlayingTestAudio(false)
          setCurrentPlayback(null)
          console.log('录音播放完成')
        }
        
        audio.onerror = (event) => {
          console.error('录音播放失败:', event)
          setIsPlayingTestAudio(false)
          setCurrentPlayback(null)
          setTestTranscript(prev => prev + '\n\n⚠️ 录音播放失败，但录音功能正常')
        }
        
        audio.onloadstart = () => {
          console.log('开始加载录音文件，大小:', testRecording.size, 'bytes')
        }
        
        audio.onloadeddata = () => {
          console.log('录音文件加载完成，时长:', audio.duration, '秒')
        }
        
        audio.oncanplaythrough = () => {
          console.log('录音文件可以完整播放')
        }
        
        setCurrentPlayback(audio)
        setIsPlayingTestAudio(true)
        
        // 尝试播放音频
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('录音开始播放')
            })
            .catch(error => {
              console.error('音频播放被阻止:', error)
              setIsPlayingTestAudio(false)
              setCurrentPlayback(null)
              setTestTranscript(prev => prev + '\n\n⚠️ 音频播放被浏览器阻止，请手动点击播放按钮')
            })
        }
        
      } catch (error) {
        console.error('创建音频对象失败:', error)
        setIsPlayingTestAudio(false)
        setTestTranscript(prev => prev + '\n\n❌ 录音播放功能不可用')
      }
    } else if (!testRecording) {
      setTestTranscript(prev => prev + '\n\n⚠️ 没有可播放的录音文件，请先进行录音测试')
    } else {
      setTestTranscript(prev => prev + '\n\n⚠️ 录音文件URL无效，请重新录音')
    }
  }

  const completeDeviceCheck = () => {
    if (speakerTestFailed) {
      alert('请先解决扬声器问题，再完成设备检测。');
      return;
    }
    stopAllAudio()
    setDeviceCheckStep("completed")
    proceedToPractice()
  }

  const skipDeviceCheck = () => {
    stopAllAudio()
    setDeviceCheckStep("completed")
    setMicrophoneStatus("unchecked")
    setSpeakerStatus("unchecked")
    proceedToPractice()
  }

  // 智能标点符号添加
  const addSmartPunctuation = (text: string): string => {
    if (typeof text !== 'string' || !text.trim()) return '';

    let result = text.trim();

    if (!/[。！？，、；：]$/.test(result)) {
      if (/^(什么|怎么|为什么|哪里|哪个|如何|是否|能否|可以|会不会)/.test(result.toLowerCase()) || /吗$/.test(result)) {
        result += "？";
      } else {
        result += "。";
      }
    }

    return " " + result;
  }

  // 加载题目
  useEffect(() => {
    loadQuestions()
  }, [moduleType])

  // 检查用户登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('检查登录状态失败:', error)
          setIsUserLoggedIn(false)
        } else {
          setIsUserLoggedIn(session?.user !== null && session?.user !== undefined)
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        setIsUserLoggedIn(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuthStatus()
  }, [])





  // 开始练习
  const startPractice = () => {
    if (questions.length === 0) {
      console.warn("⚠️ [前端] 没有可用题目，重新加载")
      loadQuestions()
      return
    }

    // 检查设备检测状态
    if (deviceCheckStep !== "completed") {
      startDeviceCheck()
      return
    }

    stopAllAudio()
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setCurrentStep("answering")
    setFeedback(null)
    setEvaluationError(null)
    setStageProgress(0)
    console.log("🔄 [前端] 开始阶段练习:", currentStage.title, `共${questions.length}道题`)
  }

  const proceedToPractice = () => {
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setSkippedQuestions(new Array(questions.length).fill(false)) // 初始化跳过状态
    setTimeLeft(300) // 5分钟每题
    setCurrentStep("answering")
    setFeedback(null)
    setEvaluationError(null)
    setStageProgress(0)
    setPracticeStartTime(new Date()) // 记录练习开始时间
    console.log("🔄 [前端] 开始阶段练习:", currentStage.title, `共${questions.length}道题`)
  }

  // 跳过当前题目
  const skipCurrentQuestion = () => {
    // 停止所有音频播放
    stopAllAudio()

    const newAnswers = [...answers, ""] // 跳过的题目答案为空字符串
    const newSkippedQuestions = [...skippedQuestions]
    newSkippedQuestions[currentQuestionIndex] = true
    
    setAnswers(newAnswers)
    setSkippedQuestions(newSkippedQuestions)
    setCurrentAnswer("")
    setStageProgress(((currentQuestionIndex + 1) / questions.length) * 100)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      console.log(`⏭️ [前端] 跳过第 ${currentQuestionIndex + 1} 题，进入第 ${currentQuestionIndex + 2} 题`)
    } else {
      console.log(`✅ [前端] 完成所有 ${questions.length} 道题目，开始评估`)
      submitAllAnswers(newAnswers, newSkippedQuestions)
    }
  }

  // 提交当前答案
  const submitCurrentAnswer = () => {
    // 检查是否有文字答案或录音
    const hasTextAnswer = currentAnswer.trim()
    const hasRecording = answerRecordings[currentQuestionIndex]
    
    if (!hasTextAnswer && !hasRecording) {
      setSpeechError('请提供文字答案或录音后再提交')
      return
    }

    // 停止所有音频播放
    stopAllAudio()

    // 如果没有文字答案但有录音，使用提示文本
    const answerToSubmit = hasTextAnswer ? currentAnswer : '[用户提供了语音回答，但语音识别未成功转换为文字]'
    const newAnswers = [...answers, answerToSubmit]
    setAnswers(newAnswers)
    
    setCurrentAnswer("")
    setStageProgress(((currentQuestionIndex + 1) / questions.length) * 100)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      console.log(`➡️ [前端] 进入第 ${currentQuestionIndex + 2} 题`)
    } else {
      console.log(`✅ [前端] 完成所有 ${questions.length} 道题目，开始评估`)
      submitAllAnswers(newAnswers, skippedQuestions)
    }
  }

  // 保存练习记录到数据库
  const savePracticeSession = async (evaluationResult: AggregatedReport, answers: string[]) => {
    try {
      // 检查用户是否已登录
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session?.user) {
        console.log("💾 [前端] 用户未登录，跳过保存练习记录")
        return
      }

      const levelScoreMap: { [key: string]: number } = {
        "优秀表现": 90,
        "良好表现": 75,
        "有待提高": 60,
        "初学乍练": 45,
        "无法评估": 0,
      };

      // 生成学习报告
      const learningReport = {
        overallSummary: evaluationResult.overallSummary,
        individualEvaluations: evaluationResult.individualEvaluations,
        stageInfo: evaluationResult.stageInfo,
        timestamp: evaluationResult.timestamp,
        evaluationId: evaluationResult.evaluationId
      };

      const practiceData = {
        stage_type: moduleType,
        questions_and_answers: questions
          .map((question, index) => ({
            question: question.question_text,
            answer: answers[index] || '',
            question_id: question.id
          }))
          .filter((qa) => qa.answer && qa.answer.trim() !== ''), // 只保存有答案的题目
        evaluation_score: levelScoreMap[evaluationResult.overallSummary.overallLevel] ?? 60,
        ai_feedback: {
          summary: evaluationResult.overallSummary.summary,
          strengths: evaluationResult.overallSummary.strengths,
          improvements: evaluationResult.overallSummary.improvements,
        },
        learning_report: learningReport
      }

      console.log("💾 [前端] 保存练习记录:", practiceData)

      const response = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(practiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存练习记录失败')
      }

      const result = await response.json()
      console.log("✅ [前端] 练习记录保存成功:", result)
    } catch (error) {
      console.error("💥 [前端] 保存练习记录失败:", error)
    }
  }

  // 单题评估 - 流水线式异步评估
  const evaluateSingleQuestion = async (questionIndex: number, question: string, answer: string, sessionId: string) => {
    // 只有在完全没有答案时才跳过评估
    if (!answer || answer.trim() === '') {
      console.log(`⏭️ [前端] 跳过第${questionIndex + 1}题的评估 - 答案为空`)
      return
    }

    try {
      console.log(`🚀 [前端] 开始第${questionIndex + 1}题的异步评估`)
      
      const requestData = {
        question: question,
        userAnswer: answer,
        stageType: moduleType,
        category: moduleType,
        difficulty: "中等",
        keyPoints: [
          "理解问题核心",
          "展现专业思维",
          "提供具体可行的解决方案"
        ],
        questionAnalysis: "本题的核心考点分析",
        answerFramework: "高分答案的建议框架",
        questionIndex: questionIndex,
        stageTitle: currentStage.title,
        sessionId: sessionId
      }

      // 发后即忘的异步调用
      fetch("/api/evaluate-single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }).then(response => {
        if (response.ok) {
          console.log(`✅ [前端] 第${questionIndex + 1}题评估请求已发送`)
        } else {
          console.error(`❌ [前端] 第${questionIndex + 1}题评估请求失败`)
        }
      }).catch(error => {
        console.error(`💥 [前端] 第${questionIndex + 1}题评估请求异常:`, error)
      })
      
    } catch (error) {
      console.error(`💥 [前端] 第${questionIndex + 1}题评估失败:`, error)
    }
  }

  // 提交所有答案并跳转到渐进式评估报告
  const submitAllAnswers = async (allAnswers: string[], skippedQuestionsArray: boolean[] = []) => {
    setIsEvaluating(true)
    setEvaluationError(null)
    setCurrentStep("analyzing")

    try {
      const response = await fetch("/api/evaluate-question-set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: questions.map(q => q.question_text),
          answers: allAnswers,
          stage: moduleType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "评估失败")
      }

      const result = await response.json()
      if (isAggregatedReport(result)) {
        setFeedback(result)
        savePracticeSession(result, allAnswers) // 保存练习记录
      } else {
        throw new Error("返回的评估数据格式不正确")
      }
    } catch (error: any) {
      console.error("💥 [前端] 评估失败:", error)
      setEvaluationError(error.message || "评估过程中发生未知错误")
      setFeedback(generateFallbackEvaluation()) // 生成备用评估结果
    } finally {
      setIsEvaluating(false)
      setCurrentStep("result")
    }
  }

  // 生成备用评估结果
  const generateFallbackEvaluation = (): AggregatedReport => {
    return {
      evaluationId: `fallback-${Date.now()}`,
      stageInfo: {
        stageType: moduleType,
        stageTitle: currentStage?.title || "Unknown Stage",
        questionSetIndex: 0, // Placeholder as it's a fallback
        questionCount: questions.length,
      },
      timestamp: new Date().toISOString(),
      overallSummary: {
        overallLevel: "良好表现",
        summary: "你的回答展现了良好的基础素养和学习态度，在表达逻辑和专业认知方面有不错的表现。",
        strengths: [
          {
            competency: "表达逻辑",
            description: "回答结构清晰，能够按照逻辑顺序组织内容，体现了良好的沟通基础。",
          },
          {
            competency: "学习态度",
            description: "对AI产品经理角色有基本认知，展现出学习和成长的积极态度。",
          },
        ],
        improvements: [
          {
            competency: "深化理解",
            suggestion: "建议进一步深化对AI产品经理角色的理解，特别是技术与商业的结合。",
            example: "可以通过分析具体的AI产品案例来提升认知深度。",
          },
        ],
      },
      individualEvaluations: questions.map((q, i) => ({
        questionContent: q.question_text,
        preliminaryAnalysis: {
          isValid: true,
          reasoning: "这是一个备用的评估结果，因为AI服务暂时不可用。"
        },
        performanceLevel: "无法评估",
        summary: "由于服务暂时不可用，这是一个系统生成的备用评估。我们建议您稍后重试以获取完整的AI分析。",
        strengths: [],
        improvements: [],
        followUpQuestion: "准备好后，请告诉我们，我们可以继续下一个问题。",
        competencyScores: {
          内容质量: 0,
          逻辑思维: 0,
          表达能力: 0,
          创新思维: 0,
          问题分析: 0
        },
        expertGuidance: {
          questionAnalysis: "由于服务暂时不可用，无法提供问题解析。",
          answerFramework: "由于服务暂时不可用，无法提供作答框架。"
        }
      }))
    }
  }

  // 语音识别初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'zh-CN'
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let newFinal = ''
        
        // 只处理新的结果，从event.resultIndex开始
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          
          if (result.isFinal) {
            newFinal += transcript
          } else {
            interim = transcript // 只保留最新的临时结果
          }
        }
        
        setInterimTranscript(interim)
        
        // 只有当有新的最终结果时才添加到答案中
        if (newFinal.trim()) {
          const processedText = addSmartPunctuation(newFinal)
          setFinalTranscript(prev => prev + processedText)
          setCurrentAnswer(prev => prev + processedText)
          console.log('语音识别新增文本:', processedText)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error)
        
        // 提供更友好的错误提示
        let errorMessage = ''
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问'
            break
          case 'no-speech':
            errorMessage = '未检测到语音，请重新尝试'
            // 对于no-speech错误，不显示错误信息，而是自动重试
            if (isRecording) {
              setTimeout(() => {
                try {
                  recognition.start()
                } catch (e) {
                  console.log('自动重试语音识别失败:', e)
                }
              }, 1000)
              return
            }
            break
          case 'audio-capture':
            errorMessage = '麦克风无法正常工作，请检查设备连接'
            break
          case 'network':
            if (networkRetryCount < 3) {
              setNetworkRetryCount(prev => prev + 1)
              errorMessage = `网络连接问题，正在尝试重新连接... (${networkRetryCount + 1}/3)`
              setSpeechError(errorMessage)
              setTimeout(() => {
                try {
                  recognition.start()
                } catch (e) {
                  console.error('重试失败:', e)
                }
              }, 1000)
              return
            } else {
              errorMessage = '网络连接问题，多次重试失败，请检查网络后重试'
              setNetworkRetryCount(0)
            }
            break
          case 'aborted':
            // 用户主动停止，不显示错误
            return
          default:
            errorMessage = `语音识别错误: ${event.error}`
        }
        
        setSpeechError(errorMessage)
        setIsRecording(false)
      }

      recognition.onstart = () => {
        setNetworkRetryCount(0)
        setSpeechError(null)
      }

      recognition.onend = () => {
        console.log('语音识别结束，当前录音状态:', isRecording)
        
        // 如果用户还在录音状态，自动重启语音识别
        if (isRecording) {
          setTimeout(() => {
            try {
              recognition.start()
              console.log('自动重启语音识别')
            } catch (error) {
              console.log('重启语音识别失败:', error)
              setIsRecording(false)
              setInterimTranscript('')
            }
          }, 100)
        } else {
          setInterimTranscript('')
        }
      }

      setRecognition(recognition)
    }
  }, [])

  // 语音合成初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = speechSynthesis.getVoices()
        const chineseVoices = voices.filter(voice => 
          voice.lang.includes('zh') || voice.lang.includes('CN')
        )
        setAvailableVoices(chineseVoices.length > 0 ? chineseVoices : voices)
        if (chineseVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(chineseVoices[0])
        }
      }
      
      updateVoices()
      speechSynthesis.onvoiceschanged = updateVoices
    }
  }, [])

  // 开始/停止语音识别和录音
  const toggleRecording = async () => {
    if (!recognition) {
      setSpeechError('您的浏览器不支持语音识别功能')
      return
    }

    if (isRecording) {
      // 停止语音识别
      recognition.stop()
      setIsRecording(false)
      
      // 停止录音
      if (currentAnswerRecorder && currentAnswerRecorder.state !== 'inactive') {
        currentAnswerRecorder.stop()
      }
      
      // 停止录音流
      if (currentAnswerStream) {
        currentAnswerStream.getTracks().forEach(track => track.stop())
        setCurrentAnswerStream(null)
      }
    } else {
      // 添加状态锁，防止重复启动录音
      const isStartingRecording = window.isStartingRecording
      if (isStartingRecording) {
        console.log('录音启动中，请稍候...')
        return
      }
      
      // 设置状态锁
      window.isStartingRecording = true
      
      try {
        setSpeechError(null)
        setInterimTranscript('')
        
        // 开始录音
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setCurrentAnswerStream(stream)
        
        // 检查MediaRecorder支持的格式
        let mimeType = 'audio/webm'
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus'
        }
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        const audioChunks: Blob[] = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: mimeType })
          
          // 更新当前题目的录音
          setAnswerRecordings(prev => {
            const newRecordings = [...prev]
            newRecordings[currentQuestionIndex] = audioBlob
            return newRecordings
          })
          
          // 清理之前的URL
          const oldUrl = answerAudioUrls[currentQuestionIndex]
          if (oldUrl) {
            URL.revokeObjectURL(oldUrl)
          }
          
          // 创建新的URL
          const audioUrl = URL.createObjectURL(audioBlob)
          setAnswerAudioUrls(prev => {
            const newUrls = [...prev]
            newUrls[currentQuestionIndex] = audioUrl
            return newUrls
          })
          
          console.log(`第${currentQuestionIndex + 1}题录音完成，文件大小:`, audioBlob.size, 'bytes，格式:', mimeType)
        }
        
        mediaRecorder.onerror = (event) => {
          console.error('录音过程中出错:', event)
          setSpeechError('录音过程中出现错误')
        }
        
        // 开始录音
        mediaRecorder.start(1000)
        setCurrentAnswerRecorder(mediaRecorder)
        
        // 开始语音识别
        recognition.start()
        setIsRecording(true)
        
      } catch (error) {
        console.error('启动录音失败:', error)
        
        // 提供更详细的错误信息
        let errorMessage = ''
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = '麦克风权限被拒绝。请点击地址栏的麦克风图标，选择"允许"，然后刷新页面重试。'
          } else if (error.name === 'NotFoundError') {
            errorMessage = '未找到麦克风设备。请检查麦克风是否正确连接，或尝试重新插拔设备。'
          } else if (error.name === 'NotReadableError') {
            errorMessage = '麦克风被其他应用占用。请关闭其他使用麦克风的应用后重试。'
          } else if (error.name === 'OverconstrainedError') {
            errorMessage = '麦克风不支持所需的音频格式。请尝试使用其他麦克风设备。'
          } else if (error.name === 'SecurityError') {
            errorMessage = '安全限制阻止了麦克风访问。请确保网站使用HTTPS连接。'
          } else {
            errorMessage = `无法启动录音功能: ${error.message || error.name || '未知错误'}`
          }
        } else {
          errorMessage = '无法启动录音功能: 发生未知错误'
        }
        
        setSpeechError(errorMessage)
        setIsRecording(false)
      } finally {
        // 确保释放状态锁
        window.isStartingRecording = false;
      }
    }
  }

  // 播放答题录音
  const playAnswerRecording = (questionIndex: number) => {
    const recording = answerRecordings[questionIndex]
    const audioUrl = answerAudioUrls[questionIndex]
    
    if (recording && audioUrl) {
      // 停止所有音频播放
      stopAllAudio()
      
      try {
        const audio = new Audio(audioUrl)
        
        audio.preload = 'auto'
        audio.volume = 0.8
        audio.controls = false
        
        audio.onended = () => {
          setIsPlayingAnswerAudio(null)
          setCurrentPlayback(null)
          console.log(`第${questionIndex + 1}题录音播放完成`)
        }
        
        audio.onerror = (event) => {
          console.error('录音播放失败:', event)
          setIsPlayingAnswerAudio(null)
          setCurrentPlayback(null)
          setSpeechError('录音播放失败')
        }
        
        setCurrentPlayback(audio)
        setIsPlayingAnswerAudio(questionIndex)
        
        const playPromise = audio.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`第${questionIndex + 1}题录音开始播放`)
            })
            .catch(error => {
              console.error('音频播放被阻止:', error)
              setIsPlayingAnswerAudio(null)
              setCurrentPlayback(null)
              setSpeechError('音频播放被浏览器阻止，请手动点击播放按钮')
            })
        }
        
      } catch (error) {
        console.error('创建音频对象失败:', error)
        setIsPlayingAnswerAudio(null)
        setSpeechError('录音播放功能不可用')
      }
    } else {
      setSpeechError('没有可播放的录音文件')
    }
  }

  // 停止答题录音播放
  const stopAnswerRecordingPlayback = () => {
    if (currentPlayback) {
      currentPlayback.pause()
      currentPlayback.currentTime = 0
      setCurrentPlayback(null)
      setIsPlayingAnswerAudio(null)
    }
  }

  // 通用音频停止函数 - 停止所有正在播放的音频
  const stopAllAudio = () => {
    // 停止录音回放
    stopAnswerRecordingPlayback()
    
    // 停止题目朗读
    stopSpeaking()
    
    // 停止测试录音播放
    stopPlayback()
    
    // 停止麦克风测试（包括录音和播放）
    if (microphoneTestInProgress) {
      stopMicrophoneTest()
    }
    
    // 停止语音识别和录音
    if (isRecording) {
      if (recognition) {
        recognition.stop()
      }
      if (currentAnswerRecorder && currentAnswerRecorder.state !== 'inactive') {
        currentAnswerRecorder.stop()
      }
      if (currentAnswerStream) {
        currentAnswerStream.getTracks().forEach(track => track.stop())
        setCurrentAnswerStream(null)
      }
      setIsRecording(false)
    }
  }

  // 朗读题目
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('您的浏览器不支持语音合成功能')
      return
    }

    // 停止所有音频播放
    stopAllAudio()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    utterance.volume = speechVolume
    utterance.lang = 'zh-CN'
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setSpeechProgress(0)
    }

    // 模拟进度
    utterance.onboundary = () => {
      setSpeechProgress(prev => Math.min(prev + 10, 90))
    }

    speechSynthesis.speak(utterance)
  }

  // 停止朗读
  const stopSpeaking = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setSpeechProgress(0)
  }

  // 重新开始练习
  const restartPractice = () => {
    // 停止所有音频播放
    stopAllAudio()
    
    setCurrentStep("overview")
    setCurrentQuestionIndex(0)
    setAnswers([])
    setCurrentAnswer("")
    setFeedback(null)
    setEvaluationError(null)
    setStageProgress(0)
    
    // 清理录音数据
    answerAudioUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url)
    })
    setAnswerRecordings([])
    setAnswerAudioUrls([])
    setCurrentAnswerRecorder(null)
    setIsPlayingAnswerAudio(null)
    
    loadQuestions()
  }

  // 加载中状态
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">正在加载题目...</h3>
            <p className="text-gray-600">请稍候，我们正在为您准备{currentStage.title}的题目</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 无题目状态
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">暂无可用题目</h3>
            <p className="text-gray-600 mb-4">该阶段的题目正在准备中，请稍后再试</p>
            <div className="space-y-2">
              <Button onClick={loadQuestions} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新加载
              </Button>
              <Button variant="outline" onClick={() => { stopAllAudio(); onBack(); }} className="w-full bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回选择
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 头部导航 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <Button variant="ghost" onClick={() => { stopAllAudio(); onBack(); }} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">返回模块选择</span>
            <span className="sm:hidden">返回</span>
          </Button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 text-${currentStage.color}-600`} />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{currentStage.title}</h1>
          </div>
        </div>

        {/* 概览阶段 */}
        {currentStep === "overview" && (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  练习概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm sm:text-base text-gray-600">{currentStage.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{questions.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">本次练习题目</div>
                  </div>
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">5</div>
                    <div className="text-xs sm:text-sm text-gray-600">每题时间(分钟)</div>
                  </div>
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{totalQuestionsInStage}</div>
                    <div className="text-xs sm:text-sm text-gray-600">题库总数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 设备检测组件 */}
            {deviceCheckStep !== "completed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    设备检测
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm sm:text-base text-gray-600">为了确保最佳的面试体验，请先检测您的麦克风和扬声器设备。</p>
                  
                  {deviceCheckStep === "idle" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <span className="text-sm sm:text-base font-medium">麦克风检测</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">测试录音和语音转文字功能</p>
                        </div>
                        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                            <span className="text-sm sm:text-base font-medium">扬声器检测</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">测试音频播放功能</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={startDeviceCheck} className="flex-1 text-sm sm:text-base">
                          开始设备检测
                        </Button>
                        <Button onClick={skipDeviceCheck} variant="outline" className="text-sm sm:text-base">
                          跳过检测
                        </Button>
                      </div>
                    </div>
                  )}

                  {deviceCheckStep === "microphone" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">麦克风测试</span>
                          <Badge variant={microphoneStatus === "success" ? "default" : microphoneStatus === "failed" ? "destructive" : microphoneStatus === "testing" ? "secondary" : "outline"}>
                            {microphoneStatus === "success" ? "正常" : microphoneStatus === "failed" ? "异常" : microphoneStatus === "testing" ? "测试中" : "未测试"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">请选择麦克风设备并开始测试，观察音量条变化并说话测试</p>
                        
                        {/* 设备选择 */}
                        {availableAudioDevices.length > 1 && (
                          <div className="mb-3">
                            <label className="text-sm font-medium mb-2 block">选择麦克风设备：</label>
                            <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                              <SelectTrigger>
                                <SelectValue placeholder="选择麦克风" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAudioDevices.map((device) => (
                                  <SelectItem key={device.deviceId} value={device.deviceId}>
                                    {device.label || `麦克风 ${device.deviceId.slice(0, 8)}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* 实时音频可视化 */}
                        {isMonitoringAudio && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">音量级别：</span>
                              <span className="text-sm text-gray-600">{Math.round(realTimeAudioLevel * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-100 ease-out"
                                style={{ width: `${Math.min(realTimeAudioLevel * 100, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>静音</span>
                              <span>适中</span>
                              <span>过大</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <Button 
                            onClick={testMicrophone} 
                            className="w-full"
                            variant={microphoneTestInProgress ? "destructive" : "default"}
                          >
                            {microphoneTestInProgress ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                停止测试
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4 mr-2" />
                                开始麦克风测试
                              </>
                            )}
                          </Button>
                          
                          {testTranscript && (
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm font-medium mb-1">语音识别结果：</p>
                              <p className="text-sm text-gray-700">{testTranscript}</p>
                            </div>
                          )}
                          
                          {testRecording && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">录音回放：</p>
                              <Button 
                                onClick={playTestRecording} 
                                variant="outline" 
                                size="sm"
                                disabled={isPlayingTestAudio}
                              >
                                {isPlayingTestAudio ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    播放中...
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    播放录音
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          {/* 测试提示 */}
                          {microphoneTestInProgress && (
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                              <p className="text-sm text-yellow-800">
                                💡 请对着麦克风说话，观察音量条变化。如果音量条有反应，说明麦克风工作正常。
                              </p>
                            </div>
                          )}
                          
                          {/* 错误提示 */}
                          {microphoneStatus === "failed" && testTranscript && (
                            <div className="bg-red-50 p-3 rounded border border-red-200">
                              <div className="flex items-start gap-2">
                                <div className="text-red-600 mt-0.5">⚠️</div>
                                <div>
                                  <p className="text-sm font-medium text-red-800 mb-1">麦克风测试失败</p>
                                  <p className="text-sm text-red-700">{testTranscript}</p>
                                  <div className="mt-2 text-xs text-red-600">
                                    <p>故障排除建议：</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      <li>检查浏览器是否允许麦克风权限</li>
                                      <li>确认麦克风设备已正确连接</li>
                                      <li>尝试刷新页面重新授权</li>
                                      <li>检查其他应用是否占用麦克风</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {microphoneStatus === "success" && (
                          <Button onClick={() => {
                            stopAllAudio()
                            setDeviceCheckStep("speaker")
                          }} className="w-full mt-3">
                            下一步：扬声器测试
                          </Button>
                        )}
                        
                        {microphoneStatus === "failed" && (
                          <div className="mt-3 space-y-2">
                            <Button onClick={testMicrophone} variant="outline" className="w-full">
                              <RotateCcw className="h-4 w-4 mr-2" />
                              重新测试
                            </Button>
                            <Button onClick={() => {
                              stopAllAudio()
                              setDeviceCheckStep("speaker")
                            }} variant="ghost" className="w-full">
                              跳过麦克风测试
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {deviceCheckStep === "speaker" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-5 w-5 text-green-600" />
                          <span className="font-medium">扬声器测试</span>
                          <Badge variant={speakerStatus === "success" ? "default" : speakerStatus === "failed" ? "destructive" : "secondary"}>
                            {speakerStatus === "success" ? "正常" : speakerStatus === "failed" ? "异常" : "未测试"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">请点击播放按钮测试扬声器，确认能听到测试音频</p>
                        
                        <div className="space-y-3">
                          <Button 
                            onClick={testSpeaker} 
                            disabled={isPlayingTestAudio}
                            className="w-full"
                          >
                            {isPlayingTestAudio ? (
                              <>
                                <VolumeX className="h-4 w-4 mr-2" />
                                播放中...
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 mr-2" />
                                播放测试音频
                              </>
                            )}
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setSpeakerStatus("success");
                                setSpeakerTestFailed(false);
                              }} 
                              variant="default" 
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              能听到声音
                            </Button>
                            <Button 
                              onClick={() => {
                                setSpeakerStatus("failed");
                                setSpeakerTestFailed(true);
                              }} 
                              variant="outline" 
                              className="flex-1"
                            >
                              <VolumeX className="h-4 w-4 mr-2" />
                              听不到声音
                            </Button>
                          </div>
                        </div>
                        
                        {(speakerStatus === "failed" || speakerStatus === "success") && (
                          <Button onClick={completeDeviceCheck} className="w-full mt-3" disabled={speakerTestFailed}>
                            完成设备检测
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 开始练习按钮 - 只在设备检测完成后显示 */}
            {deviceCheckStep === "completed" && (
              <Card>
                <CardContent className="p-6">
                  <Button onClick={startPractice} className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    开始练习
                  </Button>
                </CardContent>
              </Card>
            )}


          </div>
        )}

        {/* 答题阶段 */}
        {currentStep === "answering" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 进度条 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    题目 {currentQuestionIndex + 1} / {questions.length}
                    {skippedQuestions.filter(Boolean).length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        (已跳过 {skippedQuestions.filter(Boolean).length} 题)
                      </span>
                    )}
                  </span>

                </div>
                <Progress value={stageProgress} className="h-2" />
              </CardContent>
            </Card>

            {/* 题目卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{questions[currentQuestionIndex]?.question_text}</span>
                  <div className="flex items-center gap-2">
                    {/* 朗读题目按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(questions[currentQuestionIndex]?.question_text || '')}
                      className="flex items-center gap-1"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="h-4 w-4" />
                          停止
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          朗读
                        </>
                      )}
                    </Button>
                    
                    {/* 语音设置按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuggestion(!showSuggestion)}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      答题建议
                    </Button>
                  </div>
                </CardTitle>
                
                {/* 语音设置面板 */}
                {showSpeechSettings && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">朗读速度</label>
                      <Slider
                        value={[speechRate]}
                        onValueChange={(value) => setSpeechRate(value[0])}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">{speechRate.toFixed(1)}x</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">音量</label>
                      <Slider
                        value={[speechVolume]}
                        onValueChange={(value) => setSpeechVolume(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">{Math.round(speechVolume * 100)}%</div>
                    </div>
                    
                    {availableVoices.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">语音选择</label>
                        <Select
                          value={selectedVoice?.name || ''}
                          onValueChange={(value) => {
                            const voice = availableVoices.find(v => v.name === value)
                            setSelectedVoice(voice || null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择语音" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVoices.map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 朗读进度 */}
                {isSpeaking && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Volume2 className="h-4 w-4 animate-pulse" />
                      正在朗读...
                    </div>
                    <Progress value={speechProgress} className="h-1 mt-1" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {showSuggestion && questions[currentQuestionIndex]?.answer_suggestion && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">答题建议</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {questions[currentQuestionIndex].answer_suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    placeholder="请输入您的答案，或点击麦克风按钮使用语音输入..."
                    value={currentAnswer + interimTranscript}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[150px] sm:min-h-[200px] resize-none pr-16 sm:pr-20 text-sm sm:text-base"
                  />
                  
                  {/* 语音识别按钮 */}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={toggleRecording}
                    className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 h-10 sm:h-12 px-2 sm:px-4 rounded-lg shadow-sm"
                  >
                    {isRecording ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-base font-medium hidden sm:inline">停止</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs sm:text-base font-medium hidden sm:inline">语音</span>
                      </div>
                    )}
                  </Button>
                </div>
                
                {/* 语音识别状态 */}
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <Mic className="h-4 w-4 animate-pulse" />
                    正在录音，请说话...
                    {interimTranscript && (
                      <span className="text-gray-500">({interimTranscript})</span>
                    )}
                  </div>
                )}
                
                {/* 语音错误提示 */}
                {speechError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {speechError}
                  </div>
                )}
                
                {/* 录音回放功能 */}
                {answerRecordings[currentQuestionIndex] && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800">录音已保存</span>
                      </div>
                      <Button 
                        onClick={() => {
                          if (isPlayingAnswerAudio === currentQuestionIndex) {
                            stopAnswerRecordingPlayback()
                          } else {
                            playAnswerRecording(currentQuestionIndex)
                          }
                        }}
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        {isPlayingAnswerAudio === currentQuestionIndex ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            停止播放
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            播放录音
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 您可以随时播放录音来回顾自己的回答
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                    已输入 {currentAnswer.length} 字符
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                    <Button 
                      onClick={skipCurrentQuestion}
                      variant="outline"
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base py-2 sm:py-2.5"
                    >
                      ⏭️ 跳过此题
                    </Button>
                    <Button 
                      onClick={submitCurrentAnswer}
                      disabled={!currentAnswer.trim() && !answerRecordings[currentQuestionIndex]}
                      className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成答题"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 分析阶段 */}
        {currentStep === "analyzing" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Brain className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">AI正在分析您的回答</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">请稍候，我们正在为您生成详细的评估报告...</p>
                <div className="flex items-center justify-center space-x-2 my-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">这大约需要一分钟，请耐心等待。</p>
                {evaluationError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs sm:text-sm">{evaluationError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 结果阶段 */}
        {currentStep === "result" && feedback && (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  评估完成
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* 总体评估 */}
                <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
                    {feedback.overallSummary.overallLevel}
                  </div>
                  <p className="text-sm sm:text-base text-gray-700">{feedback.overallSummary.summary}</p>
                </div>

                {/* 优势分析 */}
                {feedback.overallSummary.strengths && feedback.overallSummary.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-green-600 mb-2 sm:mb-3 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      您的优势
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {feedback.overallSummary.strengths.map((strength, index) => (
                        <div key={index} className="p-3 sm:p-4 bg-green-50 rounded-lg">
                          <div className="text-sm sm:text-base font-medium text-green-800">{strength.competency}</div>
                          <div className="text-green-700 text-xs sm:text-sm mt-1">{strength.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 改进建议 */}
                {feedback.overallSummary.improvements && feedback.overallSummary.improvements.length > 0 && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-orange-600 mb-2 sm:mb-3 flex items-center gap-2">
                      <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                      改进建议
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {feedback.overallSummary.improvements.map((improvement, index) => (
                        <div key={index} className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                          <div className="text-sm sm:text-base font-medium text-orange-800">{improvement.competency}</div>
                          <div className="text-orange-700 text-xs sm:text-sm mt-1">{improvement.suggestion}</div>
                          {improvement.example && (
                            <div className="text-orange-600 text-xs sm:text-sm mt-2 italic">
                              示例：{improvement.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 登录引导 */}
                {!isCheckingAuth && !isUserLoggedIn && (
                  <>
                    {(() => {
                      const sessionData = {
                        user_id: 'pending',
                        module_type: moduleType,
                        created_at: new Date().toISOString(),
                        questions: questions.map((q, index) => ({
                          question_id: q.id,
                          user_answer: answers[index] || '',
                          ai_feedback: feedback?.individualEvaluations[index] || null
                        }))
                      };
                      localStorage.setItem('pendingPracticeSession', JSON.stringify(sessionData));
                    })()}
                    <LoginPrompt />
                  </>
                )}

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button onClick={restartPractice} className="flex-1 text-sm sm:text-base py-2.5 sm:py-3">
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    重新练习
                  </Button>
                  <Button onClick={() => { stopAllAudio(); onBack(); }} className="flex-1 text-sm sm:text-base py-2.5 sm:py-3">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    返回选择
                  </Button>
                  {isUserLoggedIn && (
                    <Button onClick={() => window.location.href = '/learning-report'} className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2.5 sm:py-3">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      查看完整报告
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
