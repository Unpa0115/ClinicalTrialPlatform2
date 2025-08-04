import { Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import ClinicalStudyMockup from './mockups/ClinicalStudyMockup';
import PatientSurveyMockup from './mockups/PatientSurveyMockup';
import ExaminationDataEntryMockup from './mockups/ExaminationDataEntryMockup';
import DataReviewMockup from './mockups/DataReviewMockup';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            眼科臨床試験管理プラットフォーム
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/mockups/clinical-study"
            element={<ClinicalStudyMockup />}
          />
          <Route
            path="/mockups/patient-survey"
            element={<PatientSurveyMockup />}
          />
          <Route
            path="/mockups/examination-entry"
            element={<ExaminationDataEntryMockup />}
          />
          <Route path="/mockups/data-review" element={<DataReviewMockup />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
