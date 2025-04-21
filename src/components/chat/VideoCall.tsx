import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Video, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ isOpen, onClose }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io('http://localhost:5000');

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to server');
        newSocket.emit('join_room', { username: `User-${Math.floor(Math.random() * 1000)}` });
      });

      newSocket.on('user_list', (users) => {
        const filteredUsers = users.filter((user: any) => user.sid !== newSocket.id);
        setAvailableUsers(filteredUsers);
      });

      newSocket.on('video_offer', async (data) => {
        if (!peerConnectionRef.current) {
          await setupPeerConnection();
        }
        try {
          const offer = new RTCSessionDescription(data.offer);
          await peerConnectionRef.current?.setRemoteDescription(offer);
          const answer = await peerConnectionRef.current?.createAnswer();
          await peerConnectionRef.current?.setLocalDescription(answer);
          newSocket.emit('video_answer', { answer, target: data.source });
          setSelectedUser(data.source);
          setIsCallActive(true);
        } catch (error) {
          console.error('Error handling video offer:', error);
        }
      });

      newSocket.on('video_answer', async (data) => {
        try {
          const answer = new RTCSessionDescription(data.answer);
          await peerConnectionRef.current?.setRemoteDescription(answer);
        } catch (error) {
          console.error('Error handling video answer:', error);
        }
      });

      newSocket.on('ice_candidate', async (data) => {
        try {
          const candidate = new RTCIceCandidate(data.candidate);
          await peerConnectionRef.current?.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from server');
      });

      setSocket(newSocket);
      startLocalVideo();

      return () => {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        newSocket.disconnect();
      };
    }
  }, [isOpen]);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const setupPeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && selectedUser) {
        socket.emit('ice_candidate', { candidate: event.candidate, target: selectedUser });
      }
    };

    peerConnectionRef.current = pc;
  };

  const startCall = async () => {
    if (!selectedUser || !socket) return;
    try {
      await setupPeerConnection();
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer);
      socket.emit('video_offer', { offer, target: selectedUser });
      setIsCallActive(true);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsCallActive(false);
    setSelectedUser(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleClose = () => {
    endCall();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Video Call</DialogTitle>
          <DialogDescription>
            {isCallActive ? "You're currently in a call" : "Select a user to start a video call"}
          </DialogDescription>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              className={`w-full h-full object-cover ${isCallActive ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className={`${isCallActive ? 'absolute bottom-4 right-4 w-1/4 h-auto rounded-lg border-2 border-white shadow-md' : 'w-full h-full object-cover'}`}
              autoPlay
              playsInline
              muted
            />
            {!isCallActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/30">
                <h3 className="text-white font-bold mb-2">Available Users</h3>
                {availableUsers.length > 0 ? (
                  <div className="space-y-2 w-full max-w-xs">
                    {availableUsers.map((user) => (
                      <Button
                        key={user.sid}
                        variant={selectedUser === user.sid ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedUser(user.sid)}
                      >
                        {user.username}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-white">No other users available</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {isCallActive ? (
              <>
                <Button variant="outline" size="icon" onClick={toggleMute}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" onClick={endCall}>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </>
            ) : (
              <Button disabled={!selectedUser || !isConnected} onClick={startCall}>
                <Video className="h-4 w-4 mr-2" />
                Start Call
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;