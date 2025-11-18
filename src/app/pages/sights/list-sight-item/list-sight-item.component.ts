import { Component, Input, OnInit } from '@angular/core';
import { Sight } from '../sights.service';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
  selector: 'app-list-sight-item',
  templateUrl: './list-sight-item.component.html',
  styleUrls: ['./list-sight-item.component.scss'],
})
export class ListSightItemComponent implements OnInit {
  @Input() sight: Sight;
  public isFavorite = false;
  public isVisited = false;

  constructor(private readonly userDataService: UserDataService) {}

  ngOnInit() {
    if (this.sight) {
      this.isFavorite = this.userDataService.isFavorite(this.sight.id, 'sight');
      this.isVisited = this.userDataService.isVisited(this.sight.id, 'sight');
    }
  }
}
