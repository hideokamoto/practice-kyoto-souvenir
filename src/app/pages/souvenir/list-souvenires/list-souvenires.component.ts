import { Component, Input, OnInit } from '@angular/core';
import { Souvenir } from '../souvenir.service';
import { UserDataService } from '../../../shared/services/user-data.service';

@Component({
  selector: 'app-list-souvenires',
  templateUrl: './list-souvenires.component.html',
  styleUrls: ['./list-souvenires.component.scss'],
})
export class ListSouveniresComponent implements OnInit {
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
