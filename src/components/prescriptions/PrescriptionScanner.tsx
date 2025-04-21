import React, { useState } from 'react';
import { Upload, Scan, Check, X, Pill, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface ScannedMedication {
  name: string;
  dosage: string;
  frequency: string;
}

const PrescriptionScanner: React.FC = () => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scannedText, setScannedText] = useState('');
  const [scannedMedications, setScannedMedications] = useState<ScannedMedication[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [usingCamera, setUsingCamera] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      processOCR(preview);
    };
    reader.readAsDataURL(file);
  };
  
  const processOCR = async (imageData: string) => {
    setIsScanning(true);
    setScanProgress(0);
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 95 ? newProgress : prev;
        });
      }, 200);
      
      // Call Flask backend API
      const response = await fetch('http://localhost:5000/api/scan-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData }),
      });
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      
      const data = await response.json();
      
      // Update state with OCR results
      setScanProgress(100);
      setTimeout(() => {
        setScannedText(data.text);
        setScannedMedications(data.medications);
        setIsScanning(false);
        
        toast({
          title: "Scan Complete",
          description: `Found ${data.medications.length} medications in your prescription.`,
        });
      }, 500);
    } catch (error) {
      console.error('OCR processing error:', error);
      setIsScanning(false);
      setScanProgress(0);
      
      toast({
        title: "Scan Failed",
        description: "There was an error processing your prescription. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddToMedications = () => {
    // In a real app, this would save the medications to the user's profile
    toast({
      title: "Medications Added",
      description: `${scannedMedications.length} medications have been added to your tracking list.`,
    });
  };
  
  // Camera handling logic with real capture functionality
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  
  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setUsingCamera(true);
      
      toast({
        title: "Camera Active",
        description: "Position your prescription in the frame and take a photo.",
      });
    } catch (err) {
      console.error("Camera access error:", err);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const cancelCameraCapture = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUsingCamera(false);
  };
  
  const takePicture = () => {
    if (!videoRef) return;
    
    // Create a canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw the current video frame to the canvas
      ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to a data URL and process it
      const imageData = canvas.toDataURL('image/jpeg');
      setImagePreview(imageData);
      processOCR(imageData);
      
      // Stop the camera stream
      cancelCameraCapture();
    }
  };
  
  // Handle video ref assignment
  const handleVideoRef = (ref: HTMLVideoElement | null) => {
    setVideoRef(ref);
    
    // Connect the stream to the video element when both are available
    if (ref && cameraStream) {
      ref.srcObject = cameraStream;
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-health-blue" />
          Prescription Scanner
        </CardTitle>
        <CardDescription>
          Take a photo of your prescription to automatically track your medications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {usingCamera ? (
          <div className="relative">
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
              {cameraStream ? (
                <video 
                  ref={handleVideoRef}
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                  <p>Accessing camera...</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button 
                onClick={cancelCameraCapture}
                variant="outline"
                className="w-1/3"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button 
                onClick={takePicture}
                className="w-1/3 bg-health-blue"
                disabled={!cameraStream}
              >
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            </div>
          </div>
        ) : !imagePreview ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Upload a prescription image</p>
            <p className="text-xs text-gray-500 mb-4">
              Supported formats: JPG, PNG, PDF
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={startCameraCapture}
                className="bg-health-blue"
              >
                <Camera className="mr-2 h-4 w-4" /> Use Camera
              </Button>
              <div>
                <Label 
                  htmlFor="prescription-upload"
                  className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Select Image
                </Label>
                <input
                  id="prescription-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Prescription" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white"
                  onClick={() => {
                    setImagePreview(null);
                    setScannedText('');
                    setScannedMedications([]);
                  }}
                >
                  Change
                </Button>
              </div>
              
              {isScanning ? (
                <div className="text-center p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Scanning prescription...</span>
                      <span className="text-sm font-medium text-gray-700">{scanProgress}%</span>
                    </div>
                    <Progress value={scanProgress} className="w-full" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {scanProgress < 30 ? "Analyzing image..." : 
                     scanProgress < 60 ? "Detecting text regions..." : 
                     scanProgress < 90 ? "Identifying medications..." : 
                     "Processing complete..."}
                  </p>
                </div>
              ) : scannedText ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scanned Text</label>
                    <Textarea 
                      value={scannedText}
                      onChange={(e) => setScannedText(e.target.value)}
                      rows={6}
                      className="w-full"
                    />
                  </div>
                  
                  {scannedMedications.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detected Medications</h4>
                      <ul className="space-y-2">
                        {scannedMedications.map((med, index) => (
                          <li key={index} className="p-3 bg-gray-50 rounded-lg flex items-start">
                            <Pill className="h-5 w-5 text-health-blue mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
      {scannedMedications.length > 0 && (
        <CardFooter>
          <Button 
            onClick={handleAddToMedications} 
            className="w-full bg-gradient-to-r from-health-blue to-health-light-blue"
          >
            <Check className="mr-2 h-4 w-4" />
            Add to Medication Tracker
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PrescriptionScanner;