import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  RotateCw, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  Check, 
  CheckCheck, 
  Info, 
  X, 
  Plus, 
  Sun, 
  Moon, 
  User, 
  Users, 
  Image as ImageIcon, 
  FileText, 
  Volume2,
  Trash2,
  Settings,
  Archive,
  LogOut,
  FolderOpen,
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from './supabaseClient'

// Constants for initial mocked members
const MOCK_CONTACTS = [
  { id: 'u1', name: 'Liam Carter', avatarColor: '#3498db', status: 'Sleeping' },
  { id: 'u2', name: 'Olivia Bennett', avatarColor: '#e74c3c', status: 'At work' },
  { id: 'u3', name: 'Emma Watson', avatarColor: '#2ecc71', status: 'Busy' },
  { id: 'u4', name: 'James Anderson', avatarColor: '#f1c40f', status: 'Available' },
  { id: 'u5', name: 'Sophia Martinez', avatarColor: '#9b59b6', status: 'Hey there! I am using WhatsApp.' }
];

const INITIAL_CHATS = [];

const PRESET_EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🎉', '💡', '💯', '✨', '❤️', '🙌'];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('c1');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { id: 1, text: "Hello! I am your AI assistant. How can I help you today?", sender: "ai" }
  ]);
  const [aiInput, setAiInput] = useState("");
  
  // Adjustable Sidebar Width
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  // Dropdown Menu States
  const [showSidebarDropdown, setShowSidebarDropdown] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);

  // User Settings (drawer)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [userName, setUserName] = useState('Syndicate Member');
  const [userStatus, setUserStatus] = useState('Coding is my passion');

  // Search inside current chat messages
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchText, setChatSearchText] = useState('');

  // Audio Recording Mock states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef(null);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [isAiReplying, setIsAiReplying] = useState(false);
  const aiTypingIntervalRef = useRef(null);

  // New chat modal states
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState('single');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Mock Typing state
  const [typingChatId, setTypingChatId] = useState(null);

  const messagesEndRef = useRef(null);

  const checkUsernameAvailability = async (uname) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', uname.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
      }
    } catch (e) {
      const exists = MOCK_CONTACTS.some(c => c.name.toLowerCase() === uname.toLowerCase());
      setUsernameAvailable(!exists);
    }
  };

  const validateUsernameFormat = (uname) => {
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return regex.test(uname);
  };

  useEffect(() => {
    if (!isSignUpMode) return;
    const timer = setTimeout(() => {
      const trimmed = usernameInput.trim();
      if (trimmed.length >= 3 && validateUsernameFormat(trimmed)) {
        checkUsernameAvailability(trimmed);
      } else {
        setUsernameAvailable(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameInput, isSignUpMode]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isSignUpMode) {
      if (usernameAvailable === false) {
        setLoginError('Username is not available.');
        return;
      }
      if (!usernameInput.trim() || usernameInput.length < 3) {
        setLoginError('Username must be at least 3 characters.');
        return;
      }
      if (!validateUsernameFormat(usernameInput.trim())) {
        setLoginError('Username can only contain letters, numbers, and underscores, and cannot start with a number.');
        return;
      }
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setLoginError('Please enter a valid email address.');
        return;
      }
      if (passwordInput.length < 6) {
        setLoginError('Password must be at least 6 characters.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setLoginError('Passwords do not match.');
        return;
      }

      try {
        const { error } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
          options: {
            data: {
              username: usernameInput
            }
          }
        });
        if (error) throw error;
        setIsLoggedIn(true);
        setUserName(usernameInput);
        setUserStatus(emailInput);
      } catch (err) {
        setIsLoggedIn(true);
        setUserName(usernameInput);
        setUserStatus(emailInput);
      }
    } else {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setLoginError('Please enter a valid email address.');
        return;
      }
      if (passwordInput.length < 6) {
        setLoginError('Password must be at least 6 characters.');
        return;
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput
        });
        if (error) throw error;
        setIsLoggedIn(true);
        const parsedName = emailInput.split('@')[0];
        const formattedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
        setUserName(formattedName);
        setUserStatus(emailInput);
      } catch (err) {
        setIsLoggedIn(true);
        const parsedName = emailInput.split('@')[0];
        const formattedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
        setUserName(formattedName);
        setUserStatus(emailInput);
      }
    }
  };

  // Sidebar Resizing mouse events
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Restore session from Supabase on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setIsLoggedIn(true);
        const metadataUname = session.user.user_metadata?.username;
        const parsedName = session.user.email.split('@')[0];
        const formattedName = metadataUname || (parsedName.charAt(0).toUpperCase() + parsedName.slice(1));
        setUserName(formattedName);
        setUserStatus(session.user.email);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        setIsLoggedIn(true);
        const metadataUname = session.user.user_metadata?.username;
        const parsedName = session.user.email.split('@')[0];
        const formattedName = metadataUname || (parsedName.charAt(0).toUpperCase() + parsedName.slice(1));
        setUserName(formattedName);
        setUserStatus(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserName('User');
        setUserStatus('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 260 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Audio Recording Counter
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingSeconds(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Initialize theme class on body
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  // Scroll to bottom when active chat changes or new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, typingChatId]);

  // Fetch initial chats and messages from Supabase (filtered by current user)
  useEffect(() => {
    if (!isLoggedIn || !userName) return;

    const fetchInitialData = async () => {
      try {
        const { data: dbChats, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });

        if (chatsError) throw chatsError;

        // Only keep chats that belong to this user and are valid
        const seenPairs = new Set();
        const myChats = (dbChats || []).filter(chat => {
          if (chat.type === 'group') return true;
          const n = chat.name?.toLowerCase() || '';
          const me = userName.toLowerCase();
          const parts = n.split('-');
          // Must have exactly 2 different users, and current user must be one of them
          if (parts.length !== 2) return false;
          if (parts[0] === parts[1]) return false; // no self-chats
          if (!parts.includes(me)) return false;
          // Deduplicate: keep only the first chat per user pair
          const pairKey = [...parts].sort().join('-');
          if (seenPairs.has(pairKey)) return false;
          seenPairs.add(pairKey);
          return true;
        });

        const myChatIds = myChats.map(c => c.id);

        const { data: dbMessages, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('chat_id', myChatIds.length > 0 ? myChatIds : ['__none__'])
          .order('created_at', { ascending: true });

        if (msgsError) throw msgsError;

        const chatsWithMessages = myChats.map(chat => ({
          ...chat,
          messages: (dbMessages || []).filter(msg => msg.chat_id === chat.id),
          unreadCount: 0
        }));

        setChats(chatsWithMessages);
        if (chatsWithMessages.length > 0 && !activeChatId) {
          setActiveChatId(chatsWithMessages[0].id);
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      }
    };

    fetchInitialData();
  }, [isLoggedIn, userName]);

  // Global user search effect
  useEffect(() => {
    if (!searchText.trim() || !isLoggedIn) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', `%${searchText.trim()}%`)
          .neq('username', userName);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error("Error searching users:", err);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchText, isLoggedIn, userName]);

  const handleSelectSearchResult = async (resultUser) => {
    // Check both name orderings to find existing chat
    const existingChat = chats.find(c => {
      if (c.type !== 'single') return false;
      const n = c.name.toLowerCase();
      const me = userName.toLowerCase();
      const them = resultUser.username.toLowerCase();
      return (n === `${me}-${them}` || n === `${them}-${me}`);
    });

    if (existingChat) {
      handleSelectChat(existingChat.id);
      setSearchText('');
      return;
    }

    const newChatId = `chat_${Date.now()}`;
    const newChatObj = {
      id: newChatId,
      name: `${userName}-${resultUser.username}`,
      avatar_color: '#3498db',
      type: 'single'
    };

    // Add to local state FIRST so UI updates immediately and prevents duplicate clicks
    const fullChatObj = {
      ...newChatObj,
      avatarColor: newChatObj.avatar_color,
      unreadCount: 0,
      messages: []
    };
    setChats(prev => {
      if (prev.some(c => c.id === newChatId)) return prev;
      return [fullChatObj, ...prev];
    });
    setActiveChatId(newChatId);
    setSearchText('');

    // Then persist to Supabase in background
    try {
      const { error: chatError } = await supabase
        .from('chats')
        .insert([newChatObj]);

      if (chatError) throw chatError;
    } catch (e) {
      console.error('Error creating chat in DB:', e);
    }
  };

  // Connect to Supabase Realtime channel (database changes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase.channel('db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          setChats(prev => prev.map(chat => {
            if (chat.id === newMsg.chat_id) {
              if (chat.messages.some(m => m.id === newMsg.id)) return chat;
              return {
                ...chat,
                unreadCount: chat.id === activeChatId ? 0 : chat.unreadCount + 1,
                messages: [...chat.messages, newMsg]
              };
            }
            return chat;
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        (payload) => {
          const newChat = payload.new;
          // Only add this chat if the current user is a valid participant
          const chatName = newChat.name?.toLowerCase() || '';
          const me = userName.toLowerCase();
          const parts = chatName.split('-');
          // Strict: must be exactly 2 different users, current user must be one
          if (newChat.type !== 'group') {
            if (parts.length !== 2 || parts[0] === parts[1] || !parts.includes(me)) return;
          }

          setChats(prev => {
            if (prev.some(c => c.id === newChat.id)) return prev;
            // Also check if a chat already exists for this same user pair
            const pairKey = [...parts].sort().join('-');
            const existingPair = prev.find(c => {
              if (c.type !== 'single') return false;
              const cp = c.name?.toLowerCase().split('-') || [];
              return [...cp].sort().join('-') === pairKey;
            });
            if (existingPair) return prev;
            return [{ ...newChat, messages: [], unreadCount: 0 }, ...prev];
          });
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.isTyping) {
          setTypingChatId(payload.chatId);
        } else {
          setTypingChatId(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, activeChatId]);

  // Broadcast typing status realtime
  useEffect(() => {
    if (!isLoggedIn || !activeChatId) return;

    supabase.channel('db-changes').send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        chatId: activeChatId,
        userName: userName,
        isTyping: messageText.length > 0
      }
    });
  }, [messageText, activeChatId, isLoggedIn, userName]);

  const getChatDisplayName = (chat) => {
    if (!chat) return '';
    if (chat.type === 'single' && chat.name.includes('-')) {
      const parts = chat.name.split('-');
      const otherUser = parts.find(p => p.toLowerCase() !== userName.toLowerCase());
      return otherUser || chat.name;
    }
    return chat.name;
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  // Mark active chat messages as read and clear unread badge
  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return {
          ...chat,
          unreadCount: 0,
          messages: chat.messages.map(m => m.sender === 'received' ? { ...m, status: 'read' } : m)
        };
      }
      return chat;
    }));
  };

  // Generalized message sender helper using Database Writes
  const sendNewMessageObject = async (customMsgObj) => {
    const currentChatId = activeChatId;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          id: customMsgObj.id,
          chat_id: currentChatId,
          text: customMsgObj.text,
          sender: customMsgObj.sender,
          sender_name: customMsgObj.senderName,
          media_type: customMsgObj.mediaType || null,
          status: customMsgObj.status,
          timestamp: customMsgObj.timestamp
        }]);
      if (error) throw error;
    } catch (e) {
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, customMsgObj]
          };
        }
        return chat;
      }));
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: `m_sent_${Date.now()}`,
      text: messageText,
      sender: 'sent',
      senderName: userName,
      timestamp: timeString,
      status: 'sent'
    };

    sendNewMessageObject(newMessage);
    setMessageText('');
    setShowEmojiPicker(false);
  };

  // Close context menu on any click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);
  // Handle right-click on a received message
  const handleMessageContextMenu = (e, msg) => {
    if (msg.sender !== 'received') return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: msg });
  };

  // Reply with AI using Gemini API (with OpenRouter fallback)
  const handleReplyWithAI = async () => {
    const msg = contextMenu.message;
    if (!msg) return;
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
    setIsAiReplying(true);
    setMessageText('✨ AI is thinking...');

    let aiText = '';
    try {
      // 1. Try Gemini API
      const res = await fetch(
        'https://corsproxy.io/?' + encodeURIComponent(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a helpful chat assistant. Someone sent me this message in a chat conversation:\n\n"${msg.text}"\n\nWrite a short, natural, friendly reply I can send back. Keep it under 2 sentences. Only return the reply text, nothing else.`
              }]
            }]
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } else {
        throw new Error('Gemini API failed');
      }
    } catch (geminiErr) {
      console.log('Gemini API failed, falling back to Nvidia NIM...', geminiErr);
      try {
        // 2. Try Nvidia fallback (wrapped in CORS proxy)
        const nvRes = await fetch(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
              model: 'meta/llama-3.1-8b-instruct',
              max_tokens: 150,
              messages: [{
                role: 'user',
                content: `You are a helpful chat assistant. Someone sent me this message in a chat conversation:\n\n"${msg.text}"\n\nWrite a short, natural, friendly reply I can send back. Keep it under 2 sentences. Only return the reply text, nothing else.`
              }]
            })
          }
        );

        if (nvRes.ok) {
          const nvData = await nvRes.json();
          aiText = nvData?.choices?.[0]?.message?.content?.trim() || '';
        } else {
          const errText = await nvRes.text();
          throw new Error(`Nvidia failed: ${errText}`);
        }
      } catch (nvErr) {
        console.log('Nvidia API failed, falling back to OpenRouter...', nvErr);
        try {
          // 3. Try OpenRouter fallback
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'Chat App'
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.3-70b-instruct:free',
              max_tokens: 150,
              messages: [{
                role: 'user',
                content: `You are a helpful chat assistant. Someone sent me this message in a chat conversation:\n\n"${msg.text}"\n\nWrite a short, natural, friendly reply I can send back. Keep it under 2 sentences. Only return the reply text, nothing else.`
              }]
            })
          });

          if (orRes.ok) {
            const orData = await orRes.json();
            aiText = orData?.choices?.[0]?.message?.content?.trim() || '';
          } else {
            const errText = await orRes.text();
            
            // List OpenRouter models to see what's available
            try {
              const listRes = await fetch('https://openrouter.ai/api/v1/models');
              if (listRes.ok) {
                const listData = await listRes.json();
                const freeModels = listData.data?.filter(m => m.id.endsWith(':free')).map(m => m.id);
                console.log('Available free models on OpenRouter:', freeModels);
              }
            } catch (listErr) {
              console.error('Failed to list OpenRouter models:', listErr);
            }

            throw new Error(`OpenRouter failed: ${errText}`);
          }
        } catch (orErr) {
          console.error('All AI APIs failed:', orErr);
          aiText = 'Thanks for the message!';
        }
      }
    }

    if (!aiText) aiText = 'Thanks for the message!';

    // Type out the reply character by character into the message box cleanly
    setMessageText('');
    let currentLength = 1;
    if (aiTypingIntervalRef.current) clearInterval(aiTypingIntervalRef.current);
    aiTypingIntervalRef.current = setInterval(() => {
      if (currentLength <= aiText.length) {
        setMessageText(aiText.slice(0, currentLength));
        currentLength++;
      } else {
        clearInterval(aiTypingIntervalRef.current);
        aiTypingIntervalRef.current = null;
        setIsAiReplying(false);
      }
    }, 25);
  };

  const handleSendAiMessage = () => {
    if (!aiInput.trim()) return;
    
    const userMsg = { id: Date.now(), text: aiInput, sender: "user" };
    setAiMessages(prev => [...prev, userMsg]);
    const currentInput = aiInput;
    setAiInput("");

    setTimeout(() => {
      let aiReplyText = "I'm here to assist! You can ask me about scheduling tasks, formatting dates, or other scheduler features.";
      const text = currentInput.toLowerCase();
      if (text.includes("hello") || text.includes("hi")) {
        aiReplyText = "Hello! How can I help you today?";
      } else if (text.includes("help")) {
        aiReplyText = "I can help with creating new group chats, clearing messages, or navigating the scheduler dashboard!";
      } else if (text.includes("theme") || text.includes("dark") || text.includes("light")) {
        aiReplyText = "Use the Sun/Moon toggle at the top left of the sidebar to change the theme theme!";
      } else if (text.includes("clear") || text.includes("delete")) {
        aiReplyText = "You can clear chat history or delete chats via the dropdown menu in the active chat header.";
      }

      setAiMessages(prev => [...prev, { id: Date.now() + 1, text: aiReplyText, sender: "ai" }]);
    }, 1000);
  };

  // Mock Attachment sends
  const handleAttachSend = (type) => {
    setShowAttachMenu(false);
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let messageObj = {
      id: `m_sent_${Date.now()}`,
      sender: 'sent',
      senderName: userName,
      timestamp: timeString,
      status: 'sent'
    };

    if (type === 'photo') {
      messageObj.text = '📷 Sent a photo (Syndicate design mockup)';
      messageObj.mediaType = 'photo';
    } else if (type === 'document') {
      messageObj.text = '📄 Project_Proposal_Draft_V4.pdf (2.4 MB)';
      messageObj.mediaType = 'document';
    } else if (type === 'audio') {
      messageObj.text = '🎵 Audio snippet (Voice Note)';
      messageObj.mediaType = 'audio';
    }

    sendNewMessageObject(messageObj);
  };

  // Voice recording toggle
  const toggleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording and send audio message
      setIsRecording(false);
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const recordDuration = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;
      const audioMessage = {
        id: `m_sent_${Date.now()}`,
        text: `🎤 Voice note (${recordDuration})`,
        mediaType: 'audio',
        sender: 'sent',
        senderName: userName,
        timestamp: timeString,
        status: 'sent'
      };
      sendNewMessageObject(audioMessage);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  // Group actions / Message modifications
  const handleClearMessages = () => {
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [] } : c));
    setShowChatDropdown(false);
  };

  const handleDeleteChat = () => {
    setChats(prev => prev.filter(c => c.id !== activeChatId));
    setActiveChatId(chats.find(c => c.id !== activeChatId)?.id || null);
    setShowChatDropdown(false);
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;

    const newId = `c_${Date.now()}`;
    const newChatObj = {
      id: newId,
      name: newChatName,
      avatar_color: MOCK_CONTACTS[Math.floor(Math.random() * MOCK_CONTACTS.length)].avatarColor,
      type: newChatType
    };

    try {
      const { error: chatError } = await supabase
        .from('chats')
        .insert([newChatObj]);

      if (chatError) throw chatError;

      setActiveChatId(newId);
    } catch (e) {
      // Local fallback
      const fullChatObj = {
        ...newChatObj,
        avatarColor: newChatObj.avatar_color,
        unreadCount: 0,
        messages: []
      };
      setChats(prev => [fullChatObj, ...prev]);
      setActiveChatId(newId);
    }
    setNewChatName('');
    setSelectedMembers([]);
    setShowNewChatModal(false);
  };

  const toggleMemberSelection = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(prev => prev.filter(mId => mId !== id));
    } else {
      setSelectedMembers(prev => [...prev, id]);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Filter messages in the current conversation
  const displayedMessages = activeChat ? activeChat.messages.filter(msg => 
    !showChatSearch || msg.text.toLowerCase().includes(chatSearchText.toLowerCase())
  ) : [];

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Bot size={40} style={{ color: 'var(--wa-green)' }} />
            </div>
            <h2>{isSignUpMode ? "Create Account" : "Chat App with AI"}</h2>
            <p>{isSignUpMode ? "Sign up to collaborate in real-time" : "Sign in with your workspace email address to continue"}</p>
          </div>
          <form onSubmit={handleLoginSubmit} className="login-form">
            {isSignUpMode && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="unique_username" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: '35px' }}
                  />
                  <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
                    {usernameAvailable === true && (
                      <Check size={18} style={{ color: '#2ecc71' }} title="Username is available" />
                    )}
                    {usernameAvailable === false && (
                      <X size={18} style={{ color: '#e74c3c' }} title="Username is taken" />
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@company.com" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  style={{ width: '100%', paddingRight: '35px' }}
                />
                <button 
                  type="button" 
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wa-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {isSignUpMode && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: '35px' }}
                  />
                  <button 
                    type="button" 
                    style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wa-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}
            {loginError && <div className="login-error-message">{loginError}</div>}
            <button type="submit" className="btn btn-primary login-submit-btn">
              {isSignUpMode ? "Sign Up" : "Sign In"}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', fontSize: '13px', marginTop: '4px' }}
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setLoginError('');
              }}
            >
              {isSignUpMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${activeChatId ? 'has-active-chat' : ''}`}>
      {/* Sidebar Drawer (Profile Editor Settings) */}
      <div className={`sidebar-drawer ${showProfileDrawer ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="icon-btn" style={{ color: '#fff' }} onClick={() => setShowProfileDrawer(false)}>
            <X size={24} />
          </button>
          <h2 className="drawer-title">Profile</h2>
        </div>
        <div className="drawer-content">
          <div style={{ alignSelf: 'center', marginBottom: '16px' }}>
            <div className="avatar large" style={{ backgroundColor: '#008069' }}>
              {userName[0]}
            </div>
          </div>
          <div className="drawer-section">
            <span className="form-label">Your Name</span>
            <input 
              type="text" 
              className="form-input" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
            />
          </div>
          <div className="drawer-section">
            <span className="form-label">About Status</span>
            <input 
              type="text" 
              className="form-input" 
              value={userStatus} 
              onChange={(e) => setUserStatus(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Sidebar (Resizable Left Panel) */}
      <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
        <div className="sidebar-header">
          <div className="user-avatar-container" onClick={() => setShowProfileDrawer(true)} style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ backgroundColor: '#00a884' }}>{userName[0]}</div>
            <span style={{ fontSize: '14.5px', fontWeight: '500' }}>{userName}</span>
          </div>
          <div className="sidebar-actions">
            <button className="icon-btn" onClick={() => setIsDarkTheme(!isDarkTheme)} title="Toggle Theme">
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-btn" onClick={() => setShowNewChatModal(true)} title="New Chat or Group">
              <Plus size={20} />
            </button>
            <button className="icon-btn" onClick={() => setShowSidebarDropdown(!showSidebarDropdown)} title="More Options">
              <MoreVertical size={20} />
            </button>
            
            {showSidebarDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setShowProfileDrawer(true); setShowSidebarDropdown(false); }}>
                  <User size={16} /> Profile Settings
                </button>
                <button className="dropdown-item" onClick={() => { setChats([]); setShowSidebarDropdown(false); }}>
                  <Trash2 size={16} /> Delete all chats
                </button>
                <button className="dropdown-item" onClick={async () => { 
                  await supabase.auth.signOut();
                  setIsLoggedIn(false); 
                  setEmailInput(''); 
                  setPasswordInput(''); 
                  setShowSidebarDropdown(false); 
                }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="text-secondary" style={{ color: 'var(--wa-text-secondary)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search or start a new chat"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {searchResults.length > 0 && (
            <div className="search-results-section" style={{ borderBottom: '2px solid var(--wa-border)' }}>
              <div style={{ padding: '10px 16px', fontSize: '11.5px', fontWeight: '600', color: 'var(--wa-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Global Users Found
              </div>
              {searchResults.map(userResult => (
                <div 
                  key={userResult.id} 
                  className="chat-item"
                  onClick={() => handleSelectSearchResult(userResult)}
                >
                  <div className="avatar" style={{ backgroundColor: '#3498db' }}>
                    {userResult.username[0].toUpperCase()}
                  </div>
                  <div className="chat-item-details">
                    <div className="chat-item-header">
                      <span className="chat-name">{userResult.username}</span>
                    </div>
                    <div className="chat-item-footer">
                      <span className="chat-last-message" style={{ color: 'var(--wa-green)', fontWeight: '500' }}>Click to start chat</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredChats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isTyping = typingChatId === chat.id;

            return (
              <div 
                key={chat.id} 
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div 
                  className="avatar" 
                  style={{ backgroundColor: chat.avatarColor || '#ccc' }}
                >
                  {getChatDisplayName(chat)[0].toUpperCase()}
                </div>
                
                <div className="chat-item-details">
                  <div className="chat-item-header">
                    <span className="chat-name">{getChatDisplayName(chat)}</span>
                    <span className="chat-time">{lastMsg ? lastMsg.timestamp : ''}</span>
                  </div>
                  <div className="chat-item-footer">
                    {isTyping ? (
                      <span className="chat-last-message typing">typing...</span>
                    ) : (
                      <span className="chat-last-message">
                        {chat.type === 'group' && lastMsg && `${lastMsg.senderName}: `}
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </span>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="unread-badge">{chat.unreadCount}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resize divider handle */}
      <div 
        className={`sidebar-resizer ${isResizing ? 'resizing' : ''}`} 
        onMouseDown={startResizing} 
      />

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="chat-window">
          <div className="chat-window-pattern"></div>
          
          <div className="chat-window-header">
            <button className="icon-btn mobile-back-btn" onClick={() => handleSelectChat(null)} title="Back to Chats">
              <ArrowLeft size={20} />
            </button>
            <div className="chat-header-info" onClick={() => setShowInfoSidebar(!showInfoSidebar)}>
              <div className="avatar" style={{ backgroundColor: activeChat.avatarColor || '#ccc' }}>
                {getChatDisplayName(activeChat)[0].toUpperCase()}
              </div>
              <div className="chat-header-text">
                <span className="chat-header-name">{getChatDisplayName(activeChat)}</span>
                <span className="chat-header-status">
                  {typingChatId === activeChat.id ? 'typing...' : (activeChat.type === 'group' ? `${activeChat.members.length} participants` : 'online')}
                </span>
              </div>
            </div>

            <div className="chat-header-actions">
              {showChatSearch ? (
                <div className="inline-search-bar">
                  <Search size={14} style={{ color: 'var(--wa-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="inline-search-input" 
                    placeholder="Search messages..."
                    value={chatSearchText}
                    onChange={(e) => setChatSearchText(e.target.value)}
                  />
                  <button className="icon-btn" onClick={() => { setShowChatSearch(false); setChatSearchText(''); }} style={{ padding: '2px' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="icon-btn" title="Search Messages" onClick={() => setShowChatSearch(true)}>
                  <Search size={20} />
                </button>
              )}

              <button className="icon-btn" onClick={() => setShowInfoSidebar(!showInfoSidebar)} title="Info Details">
                <Info size={20} />
              </button>
              
              <button className="icon-btn" onClick={() => setShowChatDropdown(!showChatDropdown)} title="Chat Actions">
                <MoreVertical size={20} />
              </button>

              {showChatDropdown && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setShowInfoSidebar(!showInfoSidebar); setShowChatDropdown(false); }}>
                    <Info size={16} /> Details Panel
                  </button>
                  <button className="dropdown-item" onClick={handleClearMessages}>
                    <RotateCw size={16} /> Clear Messages
                  </button>
                  <button className="dropdown-item" onClick={handleDeleteChat}>
                    <Trash2 size={16} /> Delete Chat
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="messages-container">
            <div className="date-divider">Today</div>
            
            {displayedMessages.map((msg, index) => {
              const senderName = (msg.sender_name || msg.senderName || '').trim();
              const msgDirection = senderName.toLowerCase() === userName.trim().toLowerCase() ? 'sent' : 'received';
              const showSender = activeChat.type === 'group' && msgDirection === 'received';
              return (
                <div key={msg.id || index} className={`message-bubble-wrapper ${msgDirection}`}
                  onContextMenu={(e) => handleMessageContextMenu(e, { ...msg, sender: msgDirection })}
                >
                  <div className={`message-bubble ${msgDirection}`}>
                    {showSender && <span className="message-sender">{senderName}</span>}
                    
                    {/* Check if Media snippet */}
                    {msg.mediaType === 'photo' ? (
                      <div className="message-bubble-media">
                        <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={48} style={{ color: 'var(--wa-text-secondary)' }} />
                        </div>
                        <div className="media-caption">
                          <span className="message-content">{msg.text}</span>
                        </div>
                      </div>
                    ) : msg.mediaType === 'document' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: '6px' }}>
                        <FileText size={28} style={{ color: '#e74c3c' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '500' }}>Proposal Draft.pdf</span>
                          <span style={{ fontSize: '11px', color: 'var(--wa-text-secondary)' }}>2.4 MB</span>
                        </div>
                      </div>
                    ) : msg.mediaType === 'audio' ? (
                      <div>
                        <span className="message-content">{msg.text}</span>
                        <div className="audio-waveform-container">
                          <Volume2 size={16} style={{ color: 'var(--wa-green)' }} />
                          <div className="waveform-bar">
                            <div className="wave-line active" style={{ height: '8px' }}></div>
                            <div className="wave-line active" style={{ height: '14px' }}></div>
                            <div className="wave-line active" style={{ height: '10px' }}></div>
                            <div className="wave-line active" style={{ height: '18px' }}></div>
                            <div className="wave-line active" style={{ height: '12px' }}></div>
                            <div className="wave-line" style={{ height: '6px' }}></div>
                            <div className="wave-line" style={{ height: '12px' }}></div>
                            <div className="wave-line" style={{ height: '8px' }}></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="message-content">{msg.text}</span>
                    )}

                    <div className="message-footer">
                      <span className="message-time">{msg.timestamp}</span>
                      {msgDirection === 'sent' && (
                        <span className="message-status">
                          {msg.status === 'sent' && <Check size={14} style={{ color: 'var(--wa-text-secondary)' }} />}
                          {msg.status === 'delivered' && <CheckCheck size={14} style={{ color: 'var(--wa-text-secondary)' }} />}
                          {msg.status === 'read' && <CheckCheck size={14} style={{ color: '#53bdeb' }} />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Right-click Context Menu */}
            {contextMenu.visible && (
              <div 
                className="msg-context-menu"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="context-menu-item" onClick={handleReplyWithAI}>
                  <Sparkles size={15} style={{ color: '#f1c40f' }} />
                  <span>Reply with AI</span>
                </button>
                <button className="context-menu-item" onClick={() => {
                  if (contextMenu.message) setMessageText(contextMenu.message.text);
                  setContextMenu({ visible: false, x: 0, y: 0, message: null });
                }}>
                  <MessageSquare size={15} />
                  <span>Quote Reply</span>
                </button>
              </div>
            )}

            {typingChatId === activeChat.id && (
              <div className="message-bubble-wrapper received">
                <div className="message-bubble received">
                  {activeChat.type === 'group' && (
                    <span className="message-sender">
                      {activeChat.members.find(m => m.name !== 'You')?.name || 'Member'}
                    </span>
                  )}
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* AI Helper Panel & Floater Bot Button */}
          {showAiHelper && (
            <div className="ai-helper-card">
              <div className="ai-helper-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} style={{ color: 'var(--wa-green)' }} />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>AI Assistant</span>
                </div>
                <button className="icon-btn" onClick={() => setShowAiHelper(false)} style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="ai-helper-messages">
                {aiMessages.map(msg => (
                  <div key={msg.id} className={`ai-bubble-wrapper ${msg.sender}`}>
                    <div className={`ai-bubble ${msg.sender}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ai-helper-input-container">
                <input 
                  type="text" 
                  className="ai-helper-input" 
                  placeholder="Ask something..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                />
                <button className="icon-btn" onClick={handleSendAiMessage}>
                  <Send size={16} style={{ color: 'var(--wa-green)' }} />
                </button>
              </div>
            </div>
          )}

                  {/* Suggestion Pills above input bar */}
          <div className="suggestion-pills-container">
            {['Sounds great!', 'I will review it soon.', 'Got it, thanks!', 'Let\'s catch up later.'].map((suggestion, idx) => (
              <button 
                key={idx} 
                className="suggestion-pill"
                onClick={() => {
                  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  sendNewMessageObject({
                    id: `m_sent_${Date.now()}`,
                    text: suggestion,
                    sender: 'sent',
                    senderName: userName,
                    timestamp: timeString,
                    status: 'sent'
                  });
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <button 
            className={`ai-floater-btn ${showAiHelper ? 'active' : ''}`} 
            onClick={() => setShowAiHelper(!showAiHelper)} 
            title="Ask AI Assistant"
          >
            <Bot size={22} />
          </button>

          {/* Input Bar */}
          <div className="chat-input-container">
            <div className="input-actions-left">
              <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emojis">
                <Smile size={22} />
              </button>
              
              {showEmojiPicker && (
                <div className="popover">
                  {PRESET_EMOJIS.map(emoji => (
                    <span 
                      key={emoji} 
                      className="emoji-item"
                      onClick={() => {
                        setMessageText(prev => prev + emoji);
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              <button className="icon-btn" onClick={() => setShowAttachMenu(!showAttachMenu)} title="Add Attachments">
                <Paperclip size={22} />
              </button>

              {showAttachMenu && (
                <div className="attach-menu">
                  <button className="dropdown-item" onClick={() => handleAttachSend('photo')}>
                    <ImageIcon size={16} /> Photo & Video
                  </button>
                  <button className="dropdown-item" onClick={() => handleAttachSend('document')}>
                    <FileText size={16} /> Document
                  </button>
                  <button className="dropdown-item" onClick={() => handleAttachSend('audio')}>
                    <Volume2 size={16} /> Audio Clip
                  </button>
                </div>
              )}
            </div>

            {isRecording ? (
              <div className="recording-bar">
                <div className="recording-dot-indicator" />
                <span>Recording Voice Note: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
            ) : (
              <div className="chat-input-wrapper" style={{ position: 'relative' }}>
                {isAiReplying && (
                  <div className="ai-typing-indicator">
                    <Sparkles size={13} className="ai-sparkle-spin" />
                    <span>AI composing reply...</span>
                  </div>
                )}
                <input 
                  type="text"
                  className={`chat-text-input ${isAiReplying ? 'ai-typing-active' : ''}`}
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => { if (!isAiReplying) setMessageText(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAiReplying) handleSendMessage();
                  }}
                  readOnly={isAiReplying}
                />
              </div>
            )}

            {messageText.trim() ? (
              <button className="icon-btn" onClick={handleSendMessage} title="Send Message">
                <Send size={22} style={{ color: 'var(--wa-green)' }} />
              </button>
            ) : (
              <button 
                className={`icon-btn ${isRecording ? 'recording-active' : ''}`} 
                onClick={toggleVoiceRecording}
                title={isRecording ? "Stop & Send Audio" : "Record Voice Note"}
                style={isRecording ? { color: 'var(--wa-green)' } : {}}
              >
                {isRecording ? <CheckCheck size={24} /> : <Mic size={22} />}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-chat-window">
          <div className="empty-state-title">Chat App with AI</div>
          <div className="empty-state-description">
            Send and receive messages securely linked to your email workspace. Manage tasks and team syncs in real-time.
          </div>
        </div>
      )}

      {/* Info Sidebar (Right Side) */}
      {showInfoSidebar && activeChat && (
        <div className="info-sidebar">
          <div className="info-sidebar-header">
            <button className="icon-btn" onClick={() => setShowInfoSidebar(false)}>
              <X size={20} />
            </button>
            <span className="info-sidebar-title">Contact Info</span>
          </div>

          <div className="info-sidebar-content">
            <div className="info-sidebar-section">
              <div 
                className="avatar large" 
                style={{ backgroundColor: activeChat.avatarColor || '#ccc' }}
              >
                {getChatDisplayName(activeChat)[0].toUpperCase()}
              </div>
              <div className="info-profile-name">{getChatDisplayName(activeChat)}</div>
              <div className="info-profile-status">
                {activeChat.type === 'group' ? 'Group' : 'online'}
              </div>
            </div>

            <div className="info-sidebar-section">
              <div className="info-details-list">
                <div className="info-details-item">
                  <span className="info-details-label">About / Status</span>
                  <span className="info-details-value">{activeChat.statusText || 'Available'}</span>
                </div>
                {activeChat.type === 'single' ? (
                  <div className="info-details-item">
                    <span className="info-details-label">Email Address</span>
                    <span className="info-details-value">{getChatDisplayName(activeChat).toLowerCase().replace(/\s+/g, '.')}@example.com</span>
                  </div>
                ) : (
                  <div className="info-details-item">
                    <span className="info-details-label">Members ({activeChat.members.length})</span>
                    <div className="group-members-list">
                      {activeChat.members.map(member => (
                        <div key={member.id} className="group-member-item">
                          <div className="avatar small" style={{ backgroundColor: '#8696a0' }}>
                            {member.name[0]}
                          </div>
                          <div className="group-member-info">
                            <span className="group-member-name">{member.name}</span>
                            {member.role && <span className="group-member-role">{member.role}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat/Group Creation Modal */}
      {showNewChatModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">New Conversation</span>
              <button className="icon-btn" onClick={() => setShowNewChatModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label className="checkbox-label" style={{ padding: '0' }}>
                    <input 
                      type="radio" 
                      name="chatType" 
                      checked={newChatType === 'single'}
                      onChange={() => setNewChatType('single')}
                    /> Single Chat
                  </label>
                  <label className="checkbox-label" style={{ padding: '0' }}>
                    <input 
                      type="radio" 
                      name="chatType" 
                      checked={newChatType === 'group'}
                      onChange={() => setNewChatType('group')}
                    /> Group Chat
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={newChatType === 'group' ? 'Enter group subject' : 'Enter contact name'}
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                />
              </div>

              {newChatType === 'group' && (
                <div className="form-group">
                  <label className="form-label">Select Participants</label>
                  <div className="checkbox-group">
                    {MOCK_CONTACTS.map(contact => (
                      <label key={contact.id} className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={selectedMembers.includes(contact.id)}
                          onChange={() => toggleMemberSelection(contact.id)}
                        />
                        {contact.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewChatModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateChat}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
