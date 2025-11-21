import { Component, ElementRef, ViewChild } from '@angular/core';
import { RAGResponse, RAGService } from '../../service/ragservice';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'code' | 'list';
  sources?: string[];
  isError?: boolean;
  suggestions?: string[];
  isGeneralKnowledge?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, DatePipe , FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  messages: Message[] = [];
  userInput = '';
  isLoading = false;
  
  // Updated suggestions focusing on backend development
  quickSuggestions = [
    'What are your Java and Spring Boot skills?',
    'Tell me about your banking projects',
    'What is your experience with Quarkus?',
    'How can I contact you for opportunities?',
    'Tell me about your backend development experience'
  ];

   constructor(private ragService: RAGService) {
    this.addBotMessage("👋 Hello! I'm Ehsan's AI portfolio assistant. I specialize in providing detailed information about his backend development expertise, particularly in Java, Spring Boot, Quarkus, and banking systems. What would you like to know?");
  }

   ngAfterViewChecked() {
    this.scrollToBottom();
  }

   sendMessage(): void {
  if (!this.userInput.trim() || this.isLoading) return;
    
  const userMessage: Message = {
    text: this.userInput,
    isUser: true,
    timestamp: new Date()
  };

  this.messages.push(userMessage);
  this.isLoading = true;
  const currentInput = this.userInput;
  this.userInput = '';

  this.ragService.getAIResponse(currentInput).subscribe({
    next: (response: RAGResponse) => {
      const botMessage: Message = {
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
        type: response.type,
        sources: response.sources,
        isGeneralKnowledge: response.isGeneralKnowledge // Add this
      };
      this.messages.push(botMessage);
      this.isLoading = false;
    },
    error: (error) => {
      console.error('RAG Service error:', error);
      const errorMessage: Message = {
        text: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        isError: true
      };
      this.messages.push(errorMessage);
      this.isLoading = false;
    }
  });
}

  useSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.sendMessage();
  }

  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  private addBotMessage(text: string): void {
    this.messages.push({
      text,
      isUser: false,
      timestamp: new Date()
    });
  }

   private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = 
          this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  formatText(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

}
