# EPUB Reader with AI Summarization - Complete Project Documentation

## 📖 **Product Overview**

The EPUB Reader with AI Summarization is a full-stack web application that allows users to upload EPUB files, read them chapter by chapter, and generate AI-powered summaries of the content. The system provides a clean reading interface with both full-text and summarized viewing modes.

### **Core Features**
- **EPUB Upload & Processing**: Upload and parse EPUB files with metadata extraction
- **Book Library Management**: View, organize, and delete uploaded books from the UI
- **Chapter Navigation**: Browse book structure with table of contents
- **On-Demand Content Loading**: Extract chapter content only when requested
- **AI Summarization**: Generate configurable summaries using OpenAI API with language selection
- **Markdown Rendering**: AI summaries rendered with full markdown support (headers, lists, emphasis)
- **Multi-Language Support**: Generate summaries in English or Russian
- **Reading Modes**: Switch between full text and AI summary views
- **Error Handling**: Comprehensive error display and user feedback
- **Configuration Management**: Adjustable AI settings and parameters

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   Frontend      │◄──────────────────►│   Backend       │
│   (Vue.js)      │                    │   (Node.js)     │
│   Port 3000     │                    │   Port 3001     │
└─────────────────┘                    └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   File System   │
                                       │   (EPUB files)  │
                                       └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   OpenAI API    │
                                       │ (Summarization) │
                                       └─────────────────┘
```

---

## 🔧 **Backend Implementation**

### **Technology Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **EPUB Processing**: epub2 library
- **File Handling**: fs-extra, multer
- **AI Integration**: OpenAI API
- **Development**: ts-node-dev for hot reload

### **Project Structure**
```
backend/
├── src/
│   ├── index.ts              # Express server setup
│   ├── types/index.ts        # TypeScript type definitions
│   ├── services/
│   │   ├── epubService.ts    # EPUB parsing and content extraction
│   │   ├── aiService.ts      # OpenAI API integration
│   │   └── configService.ts  # Configuration management
│   └── routes/
│       ├── upload.ts         # File upload endpoints
│       ├── books.ts          # Book and chapter endpoints
│       ├── config.ts         # Configuration endpoints
│       └── summarize.ts      # AI summarization endpoints
├── uploads/                  # Uploaded EPUB files storage
└── package.json
```

### **Key Services**

#### **EpubService** (`services/epubService.ts`)
- **Purpose**: EPUB file parsing and content extraction
- **Key Methods**:
  - `parseEpub()`: Extract metadata, chapters, and images from EPUB
  - `getChapterById()`: On-demand chapter content extraction
  - `getBookStructure()`: Retrieve book metadata and chapter list
- **Implementation Details**:
  - Uses epub2 library for EPUB parsing
  - Stores EPUB files in uploads directory with UUID-based folders
  - Extracts content using manifest IDs (not file paths)
  - Cleans HTML content to plain text
  - Handles errors gracefully with descriptive messages

#### **AIService** (`services/aiService.ts`)
- **Purpose**: OpenAI API integration for text summarization
- **Key Methods**:
  - `summarizeContent()`: Generate summaries with configurable compression ratios and language selection
  - Token counting and ratio calculation
  - Language instruction appending to prompts
- **Configuration**: Supports different OpenAI models and parameters
- **Ratio Management**: 
  - Estimates tokens using 4 characters ≈ 1 token approximation
  - Instructs AI to target specific token count based on ratio
  - Sets max_tokens to targetTokens * 2 for flexibility
  - Calculates actual compression ratio achieved

#### **ConfigService** (`services/configService.ts`)
- **Purpose**: Application configuration management
- **Features**: AI model settings, API keys, summarization parameters

### **API Endpoints**

#### **Upload Routes** (`/api/upload`)
- `POST /api/upload` - Upload and parse EPUB file
  - Accepts multipart/form-data with EPUB file
  - Returns book structure with metadata and chapter list

#### **Books Routes** (`/api/books`)
- `GET /api/books` - Get list of all uploaded books with metadata
- `GET /api/books/:bookId/structure` - Get book metadata and chapter list
- `GET /api/books/:bookId/content/:chapterId` - Get specific chapter content
- `PUT /api/books/:bookId/structure` - Update book structure
- `DELETE /api/books/:bookId` - Delete a book and all associated files

#### **Summarization Routes** (`/api/summarize`)
- `POST /api/summarize` - Generate AI summary
  - Body: `{ content: string, ratio: number, customPrompt?: string, language?: string }`
  - Returns: `{ summary: string, originalTokens: number, summaryTokens: number, actualRatio: number }`
  - Language parameter appends instruction to prompt: "Provide requested summary in {language} language"

#### **Configuration Routes** (`/api/config`)
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration

### **Data Flow**
1. **Upload**: EPUB file → multer → EpubService.parseEpub() → File system storage
2. **Chapter Loading**: Request → EpubService.getChapterById() → epub2 library → Content extraction
3. **Summarization**: Content → AIService.summarizeText() → OpenAI API → Summary response

---

## 🎨 **Frontend Implementation**

### **Technology Stack**
- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **Markdown Processing**: marked library for rendering AI summaries

### **Project Structure**
```
frontend/
├── src/
│   ├── main.ts               # Application entry point
│   ├── App.vue              # Root component
│   ├── types/index.ts       # TypeScript type definitions
│   ├── services/
│   │   └── api.ts           # API client for backend communication
│   ├── stores/
│   │   └── app.ts           # Pinia store for state management
│   └── views/
│       ├── Home.vue         # Upload and book selection
│       ├── BookReader.vue   # Main reading interface
│       └── Settings.vue     # Configuration management
├── public/
└── package.json
```

### **Key Components**

#### **Home.vue**
- **Purpose**: EPUB file upload and book library management interface
- **Features**:
  - Drag-and-drop file upload
  - Complete book library with all uploaded books
  - Book metadata display (title, author, chapters, upload date, language)
  - Book deletion with confirmation dialog
  - Refresh functionality to reload book list
  - Navigation to reading interface for any book

#### **BookReader.vue**
- **Purpose**: Main reading interface with chapter navigation and AI summarization
- **Features**:
  - **Sidebar**: Table of contents with chapter navigation
  - **Reading Modes**: Toggle between full text and AI summary
  - **Summary Controls**: Configurable compression ratio slider and language selection
  - **Language Selection**: Choose between English and Russian for AI summaries
  - **Markdown Rendering**: AI summaries displayed with proper formatting (headers, lists, emphasis)
  - **Manual Generation**: Users can adjust settings before generating summaries
  - **Error Display**: User-friendly error messages
  - **On-Demand Loading**: Chapters load content when selected

#### **Settings.vue**
- **Purpose**: Configuration management interface
- **Features**: AI model settings, API key configuration, default parameters

### **State Management** (`stores/app.ts`)
- **Pinia Store**: Centralized state management
- **Key State**:
  - `currentBook`: Currently loaded book structure
  - `currentChapter`: Active chapter content
  - `booksList`: Array of all uploaded books with metadata
  - `config`: Application configuration
  - `error`: Error messages for UI display
- **Actions**:
  - `uploadBook()`: Handle file upload
  - `loadBook()`: Load book structure
  - `loadChapter()`: Load specific chapter content
  - `summarizeContent()`: Generate AI summaries
  - `loadAllBooks()`: Fetch list of all uploaded books
  - `deleteBook()`: Remove book from storage and update UI

### **API Service** (`services/api.ts`)
- **Purpose**: HTTP client for backend communication
- **Methods**:
  - `uploadEpub()`: Upload EPUB file
  - `getAllBooks()`: Fetch list of all uploaded books
  - `deleteBook()`: Delete a specific book
  - `getBookStructure()`: Fetch book metadata
  - `getChapterContent()`: Fetch chapter content
  - `summarizeContent()`: Request AI summarization
  - `getConfig()` / `updateConfig()`: Configuration management

### **User Experience Flow**
1. **Library Management**: 
   - Home page displays all uploaded books with metadata
   - Users can view book details (title, author, chapters, upload date, language)
   - Delete books with confirmation dialog
   - Refresh book list manually or automatically on page load
2. **Upload**: User drags EPUB file → Upload to backend → Automatically navigate to book reader
3. **Reading**: User selects any book from library → Navigate to reader → Select chapter → Content loads on-demand
4. **Summarization**: 
   - User switches to summary mode → Summary controls appear
   - User adjusts compression ratio (0.1-0.8) and selects language (English/Russian)
   - User clicks "Generate" → AI creates summary with markdown formatting
   - Summary displayed with statistics and proper markdown rendering

---

## 🔄 **Data Models**

### **Core Types** (shared between frontend and backend)

```typescript
interface EpubStructure {
  id: string;
  title: string;
  author: string;
  chapters: Chapter[];
  images: ImageAsset[];
  metadata: EpubMetadata;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  href: string;
  children: Chapter[];
}

interface SummarizeRequest {
  content: string;
  images?: string[];
  ratio: number;
  customPrompt?: string;
  language?: string;
}

interface SummarizeResponse {
  summary: string;
  originalTokens: number;
  summaryTokens: number;
  actualRatio: number;
}

interface BookListItem {
  id: string;
  title: string;
  author?: string;
  metadata: EpubMetadata;
  chapterCount: number;
  uploadDate: Date;
}
```

---

## 🚀 **Development Setup**

### **Prerequisites**
- Node.js 18+
- OpenAI API key

### **Installation**
```bash
# Backend
cd backend
npm install
npm run dev  # Runs on port 3001

# Frontend
cd frontend
npm install
npm run dev  # Runs on port 3000
```

### **Environment Configuration**
```bash
# backend/.env
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

---

## 🐳 **Docker Deployment**

The project is now containerized and ready for production deployment with Docker.

### **Quick Start**
```bash
# Build images
./build-images.sh

# Deploy (modify API key first!)
./deploy-example.sh
```

### **Production Deployment**
See `deployment.md` for comprehensive deployment instructions including:
- Environment variables configuration
- Volume management
- Hardware requirements
- Security considerations
- HTTPS setup

### **Project Structure**
```
epub-read/
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── start.sh
│   ├── .env.example
│   └── src/
├── deployment.md
├── build-images.sh
└── deploy-example.sh
```

---

## 🔧 **Extension Points for Future Development**

### **Backend Extensions**
1. **Database Integration**: Replace file-based storage with PostgreSQL/MongoDB
2. **User Authentication**: Add user accounts and personal book libraries
3. **Multiple AI Providers**: Support for Claude, Gemini, etc.
4. **Advanced EPUB Features**: Support for images, tables, complex formatting
5. **Caching Layer**: Redis for chapter content and summaries
6. **Search Functionality**: Full-text search across books and chapters
7. **Bulk Operations**: Batch upload, delete, and export functionality
8. **Book Categories**: Tagging and categorization system

### **Frontend Extensions**
1. **Enhanced Library Management**: Sorting, filtering, and search within book library
2. **Reading Preferences**: Font size, themes, reading progress tracking
3. **Annotations**: Highlighting, notes, bookmarks
4. **Social Features**: Sharing summaries, reading groups
5. **Mobile App**: React Native or Flutter implementation
6. **Offline Reading**: Service worker for offline chapter access
7. **Advanced UI**: Reading statistics, progress visualization
8. **Book Organization**: Collections, favorites, and custom categories
9. **Import/Export**: Backup and restore book libraries

### **AI Enhancement Opportunities**
1. **Custom Prompts**: User-defined summarization styles
2. **Question Answering**: Chat with book content
3. **Character Analysis**: AI-generated character summaries
4. **Extended Language Support**: Add more languages beyond English and Russian
5. **Audio Summaries**: Text-to-speech integration
6. **Advanced Markdown**: Support for tables, code blocks, and complex formatting in summaries

---

## 🐛 **Error Handling Strategy**

### **Backend Error Handling**
- **EPUB Parsing Errors**: Descriptive messages for malformed files
- **Content Extraction Errors**: Specific error messages for missing chapters
- **AI API Errors**: Graceful fallback and retry logic
- **File System Errors**: Proper error propagation

### **Frontend Error Handling**
- **API Errors**: User-friendly error display with dismiss functionality
- **Loading States**: Progress indicators for long operations
- **Validation**: Client-side validation for file types and sizes
- **Fallback UI**: Graceful degradation when features are unavailable

---

## 📊 **Performance Considerations**

### **Backend Optimizations**
- **On-Demand Loading**: Chapters load only when requested
- **File Caching**: EPUB files stored locally for fast access
- **Streaming**: Large file uploads handled efficiently
- **Error Caching**: Avoid repeated failed operations

### **Frontend Optimizations**
- **Lazy Loading**: Components and routes loaded on demand
- **Virtual Scrolling**: Efficient handling of large chapter lists
- **Debounced API Calls**: Prevent excessive requests
- **Local Storage**: Cache configuration and reading preferences

This architecture provides a solid foundation for an EPUB reader with AI capabilities while maintaining clean separation of concerns and extensibility for future enhancements.
