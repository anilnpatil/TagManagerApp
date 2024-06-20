import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tag-manager',
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss']
})
export class TagManagerComponent implements OnInit {
  availableTags: string[] = [];
  selectedTags: string[] = [];
  rightBoxTags: string[] = [];
  fromAvailable = false; // Track the origin of selected tags
  message = ''; // To display success or error message
  messageType = ''; // 'success' or 'error'
  okButtonDisabled = true; // Disable OK button initially

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTags();
  }

  fetchTags(): void {
    this.http.get<{ tags: string[] }>('http://localhost:8083/readDataTagsFromPlc').subscribe(response => {
      this.http.get<string[]>('http://localhost:8081/getSavedTags').subscribe(savedTags => {
        // Filter out saved tags from available tags
        this.availableTags = response.tags.filter(tag => !savedTags.includes(tag));
        this.rightBoxTags = []; // Ensure right box tags are empty on load
        this.updateButtonGlow(); // Update button states after fetching tags
      });
    });
  }

  selectTag(tag: string, event: MouseEvent, fromRightBox = false): void {
    if (event.ctrlKey) {
      if (this.selectedTags.includes(tag)) {
        this.selectedTags = this.selectedTags.filter(t => t !== tag);
      } else {
        this.selectedTags.push(tag);
      }
    } else {
      this.selectedTags = [tag];
    }

    this.fromAvailable = !fromRightBox;
  }

  moveSelectedTags(toRight: boolean): void {
    if (toRight && this.fromAvailable) {
      this.rightBoxTags.push(...this.selectedTags);
      this.availableTags = this.availableTags.filter(tag => !this.selectedTags.includes(tag));
    } else if (!toRight && !this.fromAvailable) {
      this.availableTags.push(...this.selectedTags);
      this.rightBoxTags = this.rightBoxTags.filter(tag => !this.selectedTags.includes(tag));
    }
    this.selectedTags = [];
    this.updateButtonGlow();
  }

  isMoveToRightAllowed(): boolean {
    return this.fromAvailable && this.selectedTags.length > 0;
  }

  isMoveToLeftAllowed(): boolean {
    return !this.fromAvailable && this.selectedTags.length > 0;
  }

  saveSelectedTags(): void {
    this.http.post<{ message: string }>('http://localhost:8081/saveSelectedTags', { tags: this.rightBoxTags })
      .subscribe({
        next: response => {
          this.message = response.message;
          this.messageType = 'success';
          this.rightBoxTags = [];
          this.updateButtonGlow();
          this.fetchTags(); // Refresh available tags after saving
          this.setOkButtonDisabled(true); // Disable OK button after saving

          // Clear message after 2 seconds
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
        },
        error: error => {
          this.message = error.error ? error.error : 'Failed to save selected tags';
          this.messageType = 'error';

          // Clear message after 2 seconds
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
        }
      });
  }

  clearSelectedTags(): void {
    this.rightBoxTags = [];
    this.updateButtonGlow();
    this.setOkButtonDisabled(true); // Disable OK button after clearing
  }

  updateButtonGlow(): void {
    const okButton = document.querySelector('.bottom-controls .ok');
    const cancelButton = document.querySelector('.bottom-controls .cancel');
    if (okButton && cancelButton) {
      if (this.rightBoxTags.length > 0) {
        okButton.classList.add('glow');
        cancelButton.classList.add('glow');
      } else {
        okButton.classList.remove('glow');
        cancelButton.classList.remove('glow');
      }
      // Disable buttons based on tag presence
      (okButton as HTMLButtonElement).disabled = this.rightBoxTags.length === 0;
      (cancelButton as HTMLButtonElement).disabled = this.rightBoxTags.length === 0;
    }
  }

  setOkButtonDisabled(disabled: boolean): void {
    this.okButtonDisabled = disabled;
  }
}
