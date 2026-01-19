import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { TargetStep } from './components/steps/TargetStep';
import { KeywordStep } from './components/steps/KeywordStep';
import { TopicStep } from './components/steps/TopicStep';
import { ArticleStep } from './components/steps/ArticleStep';
import { DraftStep } from './components/steps/DraftStep';
import { SettingsModal } from './components/SettingsModal';
import { AppProvider, useApp } from './store/AppContext';

function AppContent() {
  const { app, dispatch } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial redirect to step 1 if at 0
  useEffect(() => {
    if (app.step === 0) {
      dispatch({ type: 'SET_STEP', payload: 1 });
    }
  }, [app.step, dispatch]);

  return (
    <Layout onOpenSettings={() => setIsSettingsOpen(true)}>
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

      {app.step === 1 && <TargetStep />}
      {app.step === 2 && <KeywordStep />}
      {app.step === 3 && <TopicStep />}
      {app.step === 4 && <ArticleStep />}
      {app.step === 5 && <DraftStep />}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
