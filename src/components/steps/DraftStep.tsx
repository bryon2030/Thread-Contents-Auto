
import { useState } from 'react';
import { Copy, RefreshCw, Check, FileText, Save } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AIManager } from '../../services/ai/manager';
import { GoogleSheetService } from '../../services/googleSheet';

export function DraftStep() {
    const { app, settings, dispatch } = useApp();
    const [activeDraftIndex, setActiveDraftIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [savingSheet, setSavingSheet] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeDraft = app.drafts[activeDraftIndex];
    const selectedTopic = app.topics.find(t => t.selected);

    const typeLabels: Record<string, string> = {
        concern: '고민 정리형',
        process: '과정 공유형',
        routine: '루틴/도구형'
    };

    const handleCopyAndOpen = async () => {
        if (!activeDraft) return;

        await navigator.clipboard.writeText(activeDraft.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        window.open('https://www.threads.net/', '_blank');
        window.open('https://www.threads.net/', '_blank');
    };

    const handleCopyAll = async () => {
        if (!activeDraft) return;

        const selectedArticles = app.articles.filter(a => a.selected);
        const articlesText = selectedArticles.map(a => `- ${a.title} (${a.source}): ${a.url}`).join('\n');

        const fullText = `[참고 자료]\n${articlesText}\n\n[요약 및 인사이트]\n${app.articleSummary}\n\n[내 생각]\n${app.userThoughts}\n\n[생성된 본문]\n${activeDraft.title}\n\n${activeDraft.content}`;

        await navigator.clipboard.writeText(fullText);
        alert('전체 내역이 복사되었습니다. (기사+요약+내생각+본문)');
    };

    const handleSaveToSheet = async () => {
        if (!settings.googleSheetUrl) {
            alert('설정에서 구글 시트 웹훅 URL을 먼저 등록해주세요.');
            return;
        }
        if (!activeDraft) return;

        setSavingSheet(true);
        try {
            const selectedArticles = app.articles.filter(a => a.selected);
            const articlesText = selectedArticles.map(a => `- ${a.title} (${a.url})`).join('\n');

            const data = {
                topic: selectedTopic?.text || 'No Topic',
                summary: app.articleSummary,
                thoughts: app.userThoughts,
                draft: `${activeDraft.title}\n\n${activeDraft.content}`,
                articles: articlesText
            };

            await GoogleSheetService.saveToSheet(settings.googleSheetUrl, data);
            alert('구글 시트에 성공적으로 저장되었습니다!');
        } catch (e) {
            console.error(e);
            alert('저장에 실패했습니다. URL을 확인해주세요.');
        } finally {
            setSavingSheet(false);
        }
    };

    const handleRegenerate = async () => {
        if (!selectedTopic) return;

        setRegenerating(true);
        setError(null);
        try {
            const drafts = await AIManager.generateDrafts(
                settings,
                selectedTopic.text,
                selectedTopic.userContext || '',
                app.articleSummary,
                app.userThoughts
            );
            dispatch({ type: 'SET_DRAFTS', payload: drafts });
            setActiveDraftIndex(0);
        } catch (e: any) {
            console.error(e);
            if (e.message === 'OpenAI API Call Failed' || e.message === 'Gemini API Call Failed') {
                setError('API 호출 실패. 키를 확인하세요.');
            } else {
                setError('재생성에 실패했습니다.');
            }
        } finally {
            setRegenerating(false);
        }
    };

    if (!activeDraft) return <div>글이 생성되지 않았습니다.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                3가지 버전을 제안합니다
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {app.drafts.map((draft, idx) => (
                    <button
                        key={draft.id}
                        onClick={() => setActiveDraftIndex(idx)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            background: idx === activeDraftIndex ? 'hsl(var(--color-primary))' : 'hsl(var(--color-surface))',
                            color: idx === activeDraftIndex ? 'white' : 'hsl(var(--color-text-secondary))',
                            border: idx === activeDraftIndex ? 'none' : '1px solid hsl(var(--color-border))',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {draft.type === 'process' && '⭐ '}
                        {typeLabels[draft.type]}
                    </button>
                ))}
            </div>

            {/* Editor/Preview */}
            <div className="card" style={{ padding: '24px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'hsl(var(--color-primary))',
                        background: 'hsl(225, 70%, 96%)',
                        padding: '4px 8px',
                        borderRadius: '4px'
                    }}>
                        {activeDraft.title}
                    </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(activeDraft.content);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{ display: 'flex', gap: '4px', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? '복사됨' : '본문 복사'}
                    </button>
                </div>

                <textarea
                    value={activeDraft.content}
                    onChange={(e) => {
                        const newDrafts = [...app.drafts];
                        newDrafts[activeDraftIndex] = { ...activeDraft, content: e.target.value };
                        dispatch({ type: 'SET_DRAFTS', payload: newDrafts });
                    }}
                    style={{
                        width: '100%',
                        minHeight: '200px',
                        border: 'none',
                        resize: 'vertical',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        outline: 'none',
                        color: 'hsl(var(--color-text-primary))'
                    }}
                />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    className="btn-primary"
                    onClick={handleCopyAndOpen}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}
                >
                    <Copy size={20} /> 복사하고 쓰레드(Threads) 열기
                </button>

                <button
                    className="btn-secondary"
                    onClick={handleCopyAll}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                >
                    <FileText size={20} /> 전체 내역 복사하기 (기사+요약+본문)
                </button>

                {settings.googleSheetUrl && (
                    <button
                        className="btn-secondary"
                        onClick={handleSaveToSheet}
                        disabled={savingSheet}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid #107c41', color: '#107c41', backgroundColor: 'white' }}
                    >
                        {savingSheet ? '저장 중...' : <><Save size={20} /> 구글 시트에 자동 저장하기</>}
                    </button>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button
                        onClick={() => dispatch({ type: 'RESET_FLOW' })}
                        style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}
                    >
                        처음으로 돌아가기
                    </button>
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        style={{ color: 'hsl(var(--color-primary))', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                        같은 주제로 다시 생성
                    </button>
                </div>
            </div>
            {error && <p style={{ color: 'hsl(var(--color-error))', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
    );
}
