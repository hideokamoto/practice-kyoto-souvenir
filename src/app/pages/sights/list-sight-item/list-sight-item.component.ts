import { Component, Input, OnInit, inject } from '@angular/core';
import { Sight } from '../sights.service';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
    selector: 'app-list-sight-item',
    templateUrl: './list-sight-item.component.html',
    styleUrls: ['./list-sight-item.component.scss'],
    standalone: false
})
export class ListSightItemComponent implements OnInit {
  private readonly userDataService = inject(UserDataService);

  @Input() sight: Sight;
  public isFavorite = false;
  public isVisited = false;

  ngOnInit() {
    if (this.sight) {
      this.isFavorite = this.userDataService.isFavorite(this.sight.id, 'sight');
      this.isVisited = this.userDataService.isVisited(this.sight.id, 'sight');
    }
  }
}
