import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-backpack-survey',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatButtonModule],
  templateUrl: './add_family_survey.component.html',
  styleUrls: ['./add_family_survey.component.scss']
})
export class BackpackSurveyComponent {
  // Model properties
  surveyFamilyLastName: string = '';
  surveyChildFirstName: string = '';
  surveySchool: string = '';
  surveyGrade: string = '';
  surveyBackpackNeeded: string = '';
  submitSurvey() {
    const formData = {
      lastName: this.surveyFamilyLastName,
      firstName: this.surveyChildFirstName,
      school: this.surveySchool,
      grade: this.surveyGrade,
      needsBackpack: this.surveyBackpackNeeded
    };
    console.log('Survey Submitted:', formData);
    alert('Thank you for submitting!');
    this.resetSurvey();
  }

  resetSurvey() {
    this.surveyFamilyLastName = '';
    this.surveyChildFirstName = '';
    this.surveySchool = '';
    this.surveyGrade = '';
    this.surveyBackpackNeeded = '';
  }
}
