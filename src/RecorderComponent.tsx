import { useState, useRef, useEffect, memo } from "react";
import ScreenRecorder from "./ScreenRecorder";

const RecorderComponent: React.FC = memo(() => {
    const [isRecording, setIsRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const recorderRef = useRef<ScreenRecorder>(new ScreenRecorder());
    useEffect(() => {
      const unsubscribe = recorderRef.current.onStateChange(() => {
        setIsRecording(recorderRef.current.isRecording());
      });
      return () => {
        unsubscribe();
        if (previewUrl) {
          recorderRef.current.releasePreviewUrl(previewUrl);
        }
      };
    }, []);
  
    const startRecording = async () => {
      try {
        if (previewUrl) {
          recorderRef.current.releasePreviewUrl(previewUrl);
          setPreviewUrl('');
        }
        
        // Start recording and save the promise
        const buffer = await recorderRef.current.start();
        
        // Wait for recording to finish and create preview
        const newPreviewUrl = recorderRef.current.createPreviewFromBuffer(buffer);
        setPreviewUrl(newPreviewUrl);
      } catch (err) {
        console.error('Recording failed:', err);
      }
    };
  
    const stopRecording = async () => {
      try {
        await recorderRef.current.stop();
      } catch (err) {
        console.error('Failed to stop recording:', err);
      }
    };
  
    return (
      <div className="p-4">
        <div className="space-y-4">
          <button 
            className={`px-4 py-2 rounded ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
  
          {previewUrl && (
            <div className="space-y-2">
              <video 
                src={previewUrl} 
                controls 
                className="max-w-full border rounded"
                width="640" 
                height="480" 
              />
              <button 
                onClick={() => {
                  recorderRef.current.releasePreviewUrl(previewUrl);
                  setPreviewUrl('');
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Clear Preview
              </button>
            </div>
          )}
        </div>
      </div>
    );
  });
  
  export default RecorderComponent;