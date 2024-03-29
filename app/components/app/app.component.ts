import { Component } from "@angular/core";
import { HeaderComponent } from "../header/header.component";
import { FilePanelComponent } from "../filePanel/file.panel.component";
import { BodyPanelComponent } from "../bodyPanel/body.panel.component";
import { FooterComponent } from "../footer/footer.component";
import { AddRepositoryComponent } from "../addRepository/add.repository.component";
import { AuthenticateComponent } from "../authenticate/authenticate.component"
import { TextEditorComponent } from "../textEditor/text.editor.component";
import {selectedCommitDiffPanelComponent} from "../selectedCommitDiffPanel/selected.commit.diff.panel.component";

@Component({
  selector: "my-app",
  templateUrl: 'app/components/app/app.component.html',
  directives: [HeaderComponent, FilePanelComponent, BodyPanelComponent, FooterComponent, AddRepositoryComponent, AuthenticateComponent, TextEditorComponent, selectedCommitDiffPanelComponent]
})

export class AppComponent {
  ngOnInit(): void {
    const userColorFilePath = ".settings/user_color.txt";

    // If user has previously saved a color, then set the app to that color
    if (fs.existsSync(userColorFilePath)) {
      fs.readFile(userColorFilePath, function(err, buffer) {
        console.log(buffer.toString());
        let color = buffer.toString();
        changeColor(color);
      });
    }
  }
}
