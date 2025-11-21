import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { Chat } from './components/chat/chat';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Chat],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
   title = 'Ehsan ul khaliq - Portfolio';

    @ViewChild('chatSection') chatSection!: ElementRef;

  downloadCV() {
    // Replace with your actual CV file path
    const cvUrl = '../assets/Ehsan_ul_khaliq.pdf';
    
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = 'Ehsan_Ul_Khaliq.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}
