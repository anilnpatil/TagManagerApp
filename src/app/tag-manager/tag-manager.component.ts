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
  savedTags: string[] = [];
  newTags: string[] = [];
  fromAvailable: boolean = false; // Track the origin of selected tags
  message: string = ''; // To display success or error message
  messageType: string = ''; // 'success' or 'error'

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTags();
  }

  fetchTags() {
    this.http.get<{ tags: string[] }>('http://localhost:8083/readDataTagsFromPlc').subscribe(response => {
      this.http.get<string[]>('http://localhost:8081/getSavedTags').subscribe(savedTags => {
        this.savedTags = savedTags;
        this.availableTags = response.tags.filter(tag => !savedTags.includes(tag));
        this.rightBoxTags = [...savedTags]; // Prepopulate with saved tags
      });
    });
  }

  selectTag(tag: string, event: MouseEvent, fromRightBox: boolean = false) {
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

  moveSelectedTags(toRight: boolean) {
    if (toRight && this.fromAvailable) {
      this.rightBoxTags.push(...this.selectedTags);
      this.availableTags = this.availableTags.filter(tag => !this.selectedTags.includes(tag));
    } else if (!toRight && !this.fromAvailable) {
      this.rightBoxTags = this.rightBoxTags.filter(tag => !this.selectedTags.includes(tag));
      this.availableTags.push(...this.selectedTags);
      this.deleteTagsFromDatabase(this.selectedTags);
    }
    this.newTags = this.rightBoxTags.filter(tag => !this.savedTags.includes(tag));
    this.selectedTags = [];
    this.updateButtonGlow();
  }

  isMoveToRightAllowed(): boolean {
    return this.fromAvailable && this.selectedTags.length > 0;
  }

  isMoveToLeftAllowed(): boolean {
    return !this.fromAvailable && this.selectedTags.length > 0;
  }

  saveSelectedTags() {
    const newTags = this.rightBoxTags.filter(tag => !this.savedTags.includes(tag));
    this.http.post<{ message: string }>('http://localhost:8081/saveSelectedTags', { tags: newTags })
      .subscribe({
        next: response => {
          this.message = response.message;
          this.messageType = 'success';
          this.savedTags.push(...newTags); // Update saved tags list
          this.newTags = [];
          this.updateButtonGlow();
          this.fetchTags(); // Refresh available tags after saving
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
        },
        error: error => {
          this.message = error.error ? error.error : 'Failed to save selected tags';
          this.messageType = 'error';
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
        }
      });
  }

  clearSelectedTags() {
    this.newTags.forEach(tag => {
      this.availableTags.push(tag);
    });
    this.rightBoxTags = this.rightBoxTags.filter(tag => !this.newTags.includes(tag));
    this.newTags = [];
    this.updateButtonGlow();
    this.fetchTags(); // Refresh available tags
  }

  deleteTagsFromDatabase(tags: string[]) {
    this.http.request<{ message: string }>('delete', 'http://localhost:8081/deleteTags', { body: { tags } })
      .subscribe({
        next: response => {
          this.message = response.message;
          this.messageType = 'success';
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
          this.fetchTags(); // Refresh tags after deletion
        },
        error: error => {
          this.message = error.error ? error.error : 'Failed to delete tags from database';
          this.messageType = 'error';
          setTimeout(() => {
            this.message = '';
            this.messageType = '';
          }, 2000);
        }
      });
  }

  updateButtonGlow(): void {
    const okButton = document.querySelector('.bottom-controls .ok');
    const cancelButton = document.querySelector('.bottom-controls .cancel');
    if (this.newTags.length > 0) {
      okButton?.classList.add('glow-green');
      cancelButton?.classList.add('glow-yellow');
    } else {
      okButton?.classList.remove('glow-green');
      cancelButton?.classList.remove('glow-yellow');
    }
  }

  isNewTag(tag: string): boolean {
    return this.newTags.includes(tag);
  }
}
