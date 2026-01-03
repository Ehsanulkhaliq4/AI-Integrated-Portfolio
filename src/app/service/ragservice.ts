import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, delay, delayWhen, map, Observable, of, retryWhen, scan, timeout, timer } from 'rxjs';
import { environment } from '../../environments/environment';


export interface RAGResponse {
  answer: string;
  sources?: string[];
  type: 'text' | 'list' | 'code';
  suggestions?: string[];
  isGeneralKnowledge?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RAGService {
  private knowledgeBase = `
    EHSAN UL KHALIQ - Backend Developer Profile
    
    PERSONAL INFORMATION:
    - Location: Renala khurd, Okara, Punjab, Pakistan
    - Phone: +92348 7350330
    - Email: ehsanulkhaliq274@gmail.com
    - LinkedIn: linkedin.com/in/ehsanulkhaliq
    - GitHub: github.com/Ehsanulkhaliq4
    
    EDUCATION:
    - University Of Okara (October 2020 – July 2024)
      * Bachelor of Science in Computer Science
      * Relevant Coursework: Data Structure, Algorithms Analysis, Databases, Operating System, Computer Networking, Information Security, Artificial Intelligence
    
    - Superior Group Of Colleges (Aug 2018 – Sep 2020)
      * Fsc (Pre-Engineering)
    
    PROFESSIONAL EXPERIENCE:
    - TeReSol (January 2025 - Present) - Software Design Engineer
      * Working on Credit Management and banking modules for Bank Al Habib
      * Technologies: JavaScript, XState, Java
      * Responsibilities: State management, business workflows, backend services integration
      * Security: Secure data handling, compliance with industry standards
      * Currently developing Consumer Management System using Java and Quarkus
      * Core development team member focusing on service design and architecture
    
    - TechnoGate (August 2023 - October 2023) - Junior Java Intern
      * Spring Boot backend development
      * RESTful API design and implementation
      * Application performance enhancement
      * Test results reporting system development
    
    TECHNICAL SKILLS:
    - Programming Languages: Java (Expert), JavaScript
    - Backend Frameworks: Spring Boot, Quarkus, Node.js
    - Frontend: Angular, HTML/CSS
    - Databases: MySQL, PostgreSQL
    - State Management: XSTATE
    - API Tools: Postman, Thunder Client
    - Development Tools: VS Code, Visual Studio, Git, Eclipse, IntelliJ IDEA, Taiga
    - Other: Microsoft Office
    
    PROJECTS:
    - Core Banking - Bank Al Habib
      * Credit Management and banking modules
      * Technologies: Java, Quarkus, JavaScript, XSTATE
      * Responsibilities: Business workflows, state management, backend integration
      * Compliance with banking standards, performance tuning
    
    - Consumer Management System (CMS) for Bank Al Habib
      * Core backend services using Java and Quarkus
      * Microservices architecture, system reliability
      * Database design and technical documentation
      * Core development team member
    
    - Learning Purpose (Final Year Project)
      * Comprehensive learning platform with exam portal, store, and blogs
      * Backend: Spring Boot, Hibernate, RESTful APIs
      * Frontend: Angular
      * API Testing: Postman
      * Full-stack development demonstration
    
    - Video Streaming and Downloading Application
      * Backend development for video streaming service
      * Video processing and download capabilities
      * Real-time data handling
    
    EXPERTISE AREAS:
    - Backend Development: 1+ years experience
    - API Development: RESTful APIs, microservices
    - Banking Systems: Core banking, credit management, consumer management
    - Database Design: MySQL, PostgreSQL
    - System Architecture: Scalable backend services
    - Testing: API testing with Postman
  `;

 
  

  // Portfolio-related keywords for detection
  private portfolioKeywords = [
    'ehsan', 'khaliq', 'portfolio', 'resume', 'cv', 'experience', 'skill', 
    'project', 'education', 'java', 'spring', 'quarkus', 'bank', 'banking',
    'tereSol', 'technogate', 'bank al habib', 'cms', 'credit management',
    'contact', 'email', 'phone', 'linkedin', 'github', 'backend', 'developer',
    'mysql', 'postgresql', 'angular', 'xstate', 'api', 'rest', 'microservices'
  ];

 
  private openAIApiKey = environment.openAIApiKey;
  private openAIApiUrl = environment.openAIApiUrl;

  constructor(private http: HttpClient) { 
    console.log('OpenAI API Key:', this.openAIApiKey);
  }
  
  getAIResponse(userMessage: string): Observable<RAGResponse> {
    let response$: Observable<RAGResponse>;
    if (this.isPortfolioQuestion(userMessage)) {
      response$ = of(this.generatePortfolioResponse(userMessage));
    } else {
      response$ = this.getOpenAIResponse(userMessage, false);
    }
    return response$.pipe(
      delay(3000)
    );
  }

  private isPortfolioQuestion(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase();
    return this.portfolioKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }


  private getOpenAIResponse(userMessage: string, isPortfolioContext: boolean = false): Observable<RAGResponse> {
    if (!this.isValidApiKey()) {
      return of(this.getNoAPIKeyResponse());
    }

    const systemMessage = isPortfolioContext 
      ? `You are an AI assistant for Ehsan Ul Khaliq's portfolio website. Be concise and focus on portfolio information.`
      : `You are a helpful AI assistant. Provide accurate, informative answers to general knowledge questions.`;

    const requestBody = {
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.7
    };

    return this.http.post<any>(this.openAIApiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      timeout(15000),
      retryWhen(errors => 
        errors.pipe(
          scan((retryCount: number, error: any) => {
          if (error.status === 429 && retryCount < 3) {
            console.warn(`⚠️ Rate limit hit — retrying after ${retryCount + 1} seconds...`);
            return retryCount + 1;
          } else {
            throw error;
          }
        }, 0),
        delayWhen((retryCount: number) => timer(retryCount * 2000))
        )
      ),
      map(response => this.handleOpenAISuccess(response, userMessage, isPortfolioContext)),
      catchError(error => this.handleOpenAIError(error, userMessage))
    );
  }

  private isValidApiKey(): boolean {
    return !!(this.openAIApiKey && 
            this.openAIApiKey.length > 20 && 
            !this.openAIApiKey.includes('PLACEHOLDER'));
  }

  private handleOpenAISuccess(response: any, userMessage: string, isPortfolioContext: boolean): RAGResponse {
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      return this.getAPIErrorResponse(userMessage);
    }

    return {
      answer: response.choices[0].message.content,
      type: 'text' as const,
      sources: ['OpenAI ChatGPT'],
      isGeneralKnowledge: !isPortfolioContext,
      suggestions: this.getRelevantSuggestions(userMessage)
    };
  }

  private handleOpenAIError(error: any, userMessage: string): Observable<RAGResponse> {
    console.error('❌ OpenAI API error:', error);
    
    if (error.status === 429) {
      return of(this.getRateLimitResponse(userMessage));
    }
    
    return of(this.getAPIErrorResponse(userMessage));
  }

  private getRateLimitResponse(userMessage: string): RAGResponse {
    return {
      answer: `I'm currently experiencing high demand for general knowledge questions. Please try again in a few moments.\n\nIn the meantime, I'd be happy to tell you about Ehsan's backend development skills, Java experience, banking projects, or contact information!`,
      type: 'text',
      sources: ['OpenAI Rate Limit'],
      isGeneralKnowledge: true,
      suggestions: [
        'What are your Java skills?',
        'Tell me about your banking projects',
        'What is your experience with Spring Boot?',
        'How can I contact you?',
        'What banking projects have you done?',
        'Tell me about your Spring Boot experience',
        'How can I reach you?'
      ]
    };
  }

  private getNoAPIKeyResponse(): RAGResponse {
    return {
      answer: "I'm configured to use OpenAI API for general knowledge questions, but no API key is provided. Please add your OpenAI API key to enable this feature. Meanwhile, I can answer questions about Ehsan's portfolio, skills, and experience!",
      type: 'text',
      sources: ['System Configuration'],
      isGeneralKnowledge: true,
      suggestions: [
        'What are your technical skills?',
        'Tell me about your banking projects',
        'What is your experience with Java?'
      ]
    };
  }

  private getAPIErrorResponse(userMessage: string): RAGResponse {
    return {
      answer: `I encountered an issue while processing your question about "${userMessage}". This appears to be outside my portfolio scope and requires external AI services, which are currently unavailable.\n\nI'd be happy to help with questions about Ehsan's backend development skills, Java experience, banking projects, or contact information instead!`,
      type: 'text',
      sources: ['System Status'],
      isGeneralKnowledge: true,
      suggestions: [
        'What are your Java skills?',
        'Tell me about your banking experience',
        'How can I contact you?'
      ]
    };
  }

  private getRelevantSuggestions(userMessage: string): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('tech') || lowerMessage.includes('programming') || lowerMessage.includes('code')) {
      return [
        'What are your Java skills?',
        'Tell me about your backend experience',
        'What projects have you worked on?'
      ];
    }

     if (lowerMessage.includes('backend') || lowerMessage.includes('server')) {
    return ['Tell me about your Java backend projects', 'What banking systems have you built?'];
  }
  
  if (lowerMessage.includes('frontend') || lowerMessage.includes('ui')) {
    return ['I also work with Angular for frontend', 'See my full-stack learning project'];
  }
    
    return [
      'What are your technical skills?',
      'Tell me about your banking projects',
      'What is your experience with Spring Boot?',
      'How can I contact you?'
    ];
  }

  // Portfolio response methods (your existing logic)
  private generatePortfolioResponse(userMessage: string): RAGResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('skill') || lowerMessage.includes('technology') || lowerMessage.includes('tech stack')) {
      return {
        answer: `As a Backend Developer with 1+ years of experience, here's my technical expertise:\n\n**Core Backend Technologies:**\n• Java (Primary Language) - Spring Boot, Quarkus\n• Node.js for backend services\n• RESTful API Development\n• Microservices Architecture\n\n**Databases & ORM:**\n• MySQL, PostgreSQL\n• Hibernate ORM\n• Database Design & Optimization\n\n**Frontend & State Management:**\n• Angular for frontend development\n• XSTATE for state management\n• HTML/CSS, JavaScript\n\n**Development Tools:**\n• Git, VS Code, IntelliJ IDEA, Eclipse\n• Postman/Thunder Client for API Testing\n• Taiga for project management\n\n**Domain Expertise:**\n• Core Banking Systems\n• Credit Management Systems\n• Consumer Management Systems\n• Video Streaming Applications`,
        type: 'list',
        sources: ['Technical Skills section'],
        suggestions: ['What projects have you worked on?', 'Tell me about your banking experience', 'How can I contact you?']
      };
    }

    if (lowerMessage.includes('experience') || lowerMessage.includes('work') || lowerMessage.includes('job')) {
      return {
        answer: `I have 1+ years of professional backend development experience:\n\n**Software Design Engineer at TeReSol** (Jan 2025 - Present)\n• Developing Credit Management and banking modules for Bank Al Habib\n• Working with JavaScript, XState, and Java\n• Implementing state management and business workflows\n• Building Consumer Management System using Java and Quarkus\n• Core team member focusing on service architecture\n\n**Junior Java Intern at TechnoGate** (Aug - Oct 2023)\n• Spring Boot backend development\n• RESTful API design and implementation\n• Test reporting system development\n\nMy experience spans banking systems, enterprise applications, and full-stack development with strong focus on backend architecture.`,
        type: 'list',
        sources: ['Professional Experience section'],
        suggestions: ['What banking projects have you done?', 'Tell me about your Java experience', 'Show me your projects']
      };
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('portfolio') || lowerMessage.includes('work on')) {
      return {
        answer: `Here are my key backend development projects:\n\n**🏦 Core Banking - Bank Al Habib**\n• Credit Management and banking modules\n• Technologies: Java, Quarkus, JavaScript, XSTATE\n• State management and backend service integration\n• Banking standards compliance and performance optimization\n\n**💳 Consumer Management System (CMS)**\n• Core backend services using Java and Quarkus\n• Microservices architecture for Bank Al Habib\n• Database design and system reliability\n• Technical documentation and core development\n\n**🎓 Learning Platform (Final Year Project)**\n• Full-stack learning platform with exam portal\n• Backend: Spring Boot, Hibernate, RESTful APIs\n• Frontend: Angular\n• API testing with Postman\n\n**🎬 Video Streaming Application**\n• Backend for video streaming and downloading\n• Video processing capabilities\n• Real-time data handling systems\n\nThese projects demonstrate my expertise in building scalable backend systems for various domains.`,
        type: 'list',
        sources: ['Projects section'],
        suggestions: ['What technologies did you use?', 'Tell me about your banking experience', 'What is your Java expertise?']
      };
    }

    if (lowerMessage.includes('java') || lowerMessage.includes('spring') || lowerMessage.includes('quarkus')) {
      return {
        answer: `**Java Backend Development Expertise:**\n\nI specialize in Java-based backend development with extensive experience in:\n\n**Spring Boot:**\n• RESTful API development\n• Microservices architecture\n• Hibernate ORM integration\n• Application performance optimization\n• In-house internship experience at TechnoGate\n\n**Quarkus:**\n• Currently working with Quarkus at TeReSol\n• Building Consumer Management System for banking\n• Supersonic Subatomic Java for cloud-native applications\n• Core backend services development\n\n**Enterprise Java:**\n• Banking system development (Bank Al Habib)\n• Credit management modules\n• Secure data handling and compliance\n• System architecture and design\n\nI have hands-on experience building production-grade backend systems using both Spring Boot and Quarkus frameworks.`,
        type: 'list',
        sources: ['Technical Skills', 'Professional Experience', 'Projects'],
        suggestions: ['What banking projects used Java?', 'Tell me about your Spring Boot experience', 'What is Quarkus?']
      };
    }

    if (lowerMessage.includes('bank') || lowerMessage.includes('credit') || lowerMessage.includes('financial')) {
      return {
        answer: `**Banking Domain Expertise:**\n\nI have substantial experience in banking and financial systems development:\n\n**Core Banking Development at TeReSol:**\n• Credit Management System for Bank Al Habib\n• Banking modules development using Java and JavaScript\n• State management with XSTATE\n• Business workflow implementation\n• Secure data handling and compliance\n\n**Consumer Management System:**\n• Core backend services for banking operations\n• Microservices architecture with Quarkus\n• Database design and system reliability\n• Enterprise-level application development\n\n**Key Responsibilities:**\n• Backend service integration\n• Performance tuning and optimization\n• Collaboration with cross-functional teams\n• Compliance with banking industry standards\n\nMy banking projects demonstrate my ability to work on critical financial systems with high reliability requirements.`,
        type: 'list',
        sources: ['Professional Experience at TeReSol', 'Projects section'],
        suggestions: ['What technologies did you use in banking?', 'Tell me about your Java experience', 'What other projects have you done?']
      };
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone') || lowerMessage.includes('hire')) {
      return {
        answer: `**Contact Information:**\n\n📧 **Email:** ehsanulkhaliq274@gmail.com\n📞 **Phone:** +92348 7350330\n💼 **LinkedIn:** linkedin.com/in/ehsanulkhaliq\n🐙 **GitHub:** github.com/Ehsanulkhaliq4\n📍 **Location:** Renala khurd, Okara, Punjab, Pakistan\n\nI'm currently working as a Software Design Engineer at TeReSol and open to new opportunities in backend development, particularly in Java, Spring Boot, Quarkus, and banking systems.\n\nFeel free to reach out for:\n• Backend development positions\n• Java/Spring Boot/Quarkus projects\n• Banking/financial system development\n• API development and integration\n• Full-stack development roles`,
        type: 'list',
        sources: ['Personal Information'],
        suggestions: ['What are your technical skills?', 'Tell me about your experience', 'What projects have you worked on?']
      };
    }

    if (lowerMessage.includes('about') || lowerMessage.includes('who are you') || lowerMessage.includes('introduce')) {
      return {
        answer: `I'm **Ehsan Ul Khaliq**, a Backend Developer with 1+ years of professional experience specializing in Java, Spring Boot, and Quarkus development.\n\n**My Expertise:**\n• Backend Development with Java ecosystems\n• Banking and Financial Systems\n• RESTful API and Microservices Architecture\n• Database Design with MySQL/PostgreSQL\n• Full-stack development with Angular\n\n**Current Role:** Software Design Engineer at TeReSol, working on core banking systems for Bank Al Habib, focusing on credit management and consumer management systems.\n\nI'm passionate about building scalable, reliable backend systems and have experience across banking, education, and media streaming domains. I enjoy solving complex problems and continuously learning new technologies to enhance my backend development skills.`,
        type: 'text',
        sources: ['Professional Profile'],
        suggestions: ['What are your technical skills?', 'Tell me about your projects', 'How can I contact you?']
      };
    }

    if (lowerMessage.includes('code example') || lowerMessage.includes('show me code')) {
  return {
    answer: `Here's a simple Spring Boot REST endpoint I've worked with:\n\n\`\`\`java\n@RestController\npublic class CreditController {\n    @GetMapping("/credit/{id}")\n    public ResponseEntity<Credit> getCredit(@PathVariable Long id) {\n        // Business logic here\n    }\n}\n\`\`\``,
    type: 'code',
    sources: ['Java/Spring Experience'],
    suggestions: ['Tell me more about your banking projects', 'What other frameworks do you know?']
  };
}

    if (lowerMessage.includes('education') || lowerMessage.includes('degree') || lowerMessage.includes('university')) {
      return {
        answer: `**Educational Background:**\n\n**University Of Okara** (October 2020 – July 2024)\n• Bachelor of Science in Computer Science\n• Relevant Coursework: Data Structures, Algorithms Analysis, Databases, Operating Systems, Computer Networking, Information Security, Artificial Intelligence\n\n**Superior Group Of Colleges** (Aug 2018 – Sep 2020)\n• Fsc (Pre-Engineering)\n\nMy computer science education provided me with strong fundamentals in algorithms, data structures, and system design, which I apply daily in my backend development work.`,
        type: 'list',
        sources: ['Education section'],
        suggestions: ['What are your technical skills?', 'Tell me about your experience', 'What projects have you done?']
      };
    }
    



    // Default portfolio response
    return {
      answer: `I understand you're asking about "${userMessage}". As a Backend Developer with expertise in Java, Spring Boot, Quarkus, and banking systems, I can provide detailed information about:\n\n• My technical skills and backend technologies\n• Professional experience at TeReSol and TechnoGate\n• Banking projects (Core Banking, CMS)\n• Java/Spring Boot/Quarkus development\n• API development and database design\n• Education and learning projects\n• Contact information and availability\n\nCould you specify what you'd like to know about my backend development experience?`,
      type: 'text',
      sources: ['General Portfolio Information'],
      suggestions: [
        'What are your Java skills?',
        'Tell me about your banking projects',
        'What is your experience with Spring Boot?',
        'How can I contact you?'
      ]
    };
  }

}
