import { Component, Input, OnInit } from '@angular/core';
import { Souvenir } from '../souvenir.service';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
    selector: 'app-list-souvenirs',
    templateUrl: './list-souvenirs.component.html',
    styleUrls: ['./list-souvenirs.component.scss'],
    standalone: false
})
export class ListSouvenirsComponent implements OnInit {
  @Input() souvenir: Souvenir;
  public isFavorite = false;
  public isVisited = false;

  constructor(private readonly userDataService: UserDataService) {}

  ngOnInit() {
    if (this.souvenir) {
      this.isFavorite = this.userDataService.isFavorite(this.souvenir.id, 'souvenir');
      this.isVisited = this.userDataService.isVisited(this.souvenir.id, 'souvenir');
    }
  }
}

