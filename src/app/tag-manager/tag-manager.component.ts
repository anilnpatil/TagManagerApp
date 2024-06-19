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
  fromAvailable: boolean = false; // Track the origin of selected tags

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTags();
  }

  fetchTags() {
    this.http.get<{ tags: string[] }>('http://localhost:8083/readDataTagsFromPlc').subscribe(response => {
      this.http.get<string[]>('http://localhost:8081/getSavedTags').subscribe(savedTags => {
        // Filter out saved tags from available tags
        this.availableTags = response.tags.filter(tag => !savedTags.includes(tag));
        this.rightBoxTags = []; // Ensure right box tags are empty on load
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
      this.availableTags.push(...this.selectedTags);
      this.rightBoxTags = this.rightBoxTags.filter(tag => !this.selectedTags.includes(tag));
    }
    this.selectedTags = [];
  }

  isMoveToRightAllowed(): boolean {
    return this.fromAvailable && this.selectedTags.length > 0;
  }

  isMoveToLeftAllowed(): boolean {
    return !this.fromAvailable && this.selectedTags.length > 0;
  }

  saveSelectedTags() {
    this.http.post('http://localhost:8081/saveSelectedTags', { tags: this.rightBoxTags }).subscribe(() => {
      this.rightBoxTags = [];
      this.fetchTags(); // Refresh available tags after saving
    });
  }

  clearSelectedTags() {
    this.rightBoxTags = [];
  }
}
