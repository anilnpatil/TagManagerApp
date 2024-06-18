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
    this.loadState();
    this.fetchTags();
  }

  fetchTags() {
    this.http.get<{ tags: string[] }>('http://localhost:8083/readDataTagsFromPlc').subscribe(response => {
      this.availableTags = response.tags.filter(tag => !this.rightBoxTags.includes(tag));
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
    this.saveState();
  }

  isMoveToRightAllowed(): boolean {
    return this.fromAvailable && this.selectedTags.length > 0;
  }

  isMoveToLeftAllowed(): boolean {
    return !this.fromAvailable && this.selectedTags.length > 0;
  }

  saveState() {
    localStorage.setItem('rightBoxTags', JSON.stringify(this.rightBoxTags));
    localStorage.setItem('availableTags', JSON.stringify(this.availableTags));
  }

  loadState() {
    const rightBoxTags = localStorage.getItem('rightBoxTags');
    const availableTags = localStorage.getItem('availableTags');
    if (rightBoxTags) {
      this.rightBoxTags = JSON.parse(rightBoxTags);
    }
    if (availableTags) {
      this.availableTags = JSON.parse(availableTags);
    }
  }
}
