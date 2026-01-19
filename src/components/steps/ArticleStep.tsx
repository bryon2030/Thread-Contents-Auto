import { useState } from 'react';
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { AIManager } from '../../services/ai/manager';
import type { Article } from '../../types';

export function ArticleStep() {
    const { app, settings, dispatch } = useApp();
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Local state for editing articles
    const [editMode, setEditMode] = useState<string | null>(null); // 'new' or article ID
    const [editForm, setEditForm] = useState({ title: '', url: '', source: '' });

    const selectedTopic = app.topics.find(t => t.selected);
    const selectedArticles = app.articles.filter(a => a.selected);

    // Initial load check? (Ideally done in previous step transition, but here is fine too if empty)
    // For now assume articles are loaded or we provide a button to load.

    const handleGenerateArticles = async () => {
        if (!selectedTopic) return;
        setLoading(true);
        setError(null);
        try {
            const articles = await AIManager.generateArticles(settings, selectedTopic.text);
            dispatch({ type: 'SET_ARTICLES', payload: articles });
        } catch (err: any) {
            console.error(err);
            setError('관련 기사를 찾지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (selectedArticles.length === 0) return;
        setSummaryLoading(true);
        setError(null);
        try {
            const summary = await AIManager.summarizeArticles(settings, selectedArticles);
            dispatch({ type: 'SET_ARTICLE_SUMMARY', payload: summary });
        } catch (err: any) {
            console.error(err);
            setError('요약 생성에 실패했습니다.');
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleNext = async () => {
        if (!selectedTopic) return;
        setLoading(true);
        try {
            const drafts = await AIManager.generateDrafts(
                settings,
                selectedTopic.text,
                selectedTopic.userContext || '',
                app.articleSummary,
                app.userThoughts
            );
            dispatch({ type: 'SET_DRAFTS', payload: drafts });
            dispatch({ type: 'SET_STEP', payload: 5 }); // Next step (DraftStep)
        } catch (err: any) {
            if (err.message === 'OpenAI API Call Failed' || err.message === 'Gemini API Call Failed') {
                setError('API 호출 실패. API Key를 확인하세요.');
            } else {
                setError('초안 생성 실패.');
            }
        } finally {
            setLoading(false);
        }
    };

    const startEditFn = (article?: Article) => {
        if (article) {
            setEditMode(article.id);
            setEditForm({ title: article.title, url: article.url, source: article.source || '' });
        } else {
            setEditMode('new');
            setEditForm({ title: '', url: 'https://', source: '' });
        }
    };

    const saveEdit = () => {
        if (editMode === 'new') {
            const newArticle: Article = {
                id: `manual-${Date.now()}`,
                title: editForm.title || '제목 없음',
                url: editForm.url,
                source: editForm.source || 'Direct Input',
                selected: true
            };
            dispatch({ type: 'SET_ARTICLES', payload: [...app.articles, newArticle] });
        } else if (editMode) {
            dispatch({
                type: 'UPDATE_ARTICLE',
                payload: {
                    id: editMode,
                    updates: {
                        title: editForm.title,
                        url: editForm.url,
                        source: editForm.source
                    }
                }
            });
        }
        setEditMode(null);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                관련 기사 & 정보 추천
            </h2>
            <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '2rem' }}>
                전문성 강화를 위해 신뢰할 수 있는 정보를 선택하고 내 생각을 더해보세요.
            </p>

            {/* Article List Section */}
            <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid hsl(var(--color-border))', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>1. 참고할 기사/자료 선택</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => startEditFn()} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>+ 직접 추가</button>
                        {app.articles.length === 0 && (
                            <button onClick={handleGenerateArticles} disabled={loading} className="btn-primary" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                                {loading ? '검색 중...' : 'AI 기사 추천 받기'}
                            </button>
                        )}
                        {app.articles.length > 0 && (
                            <button onClick={handleGenerateArticles} disabled={loading} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                <RefreshCw size={14} /> 재검색
                            </button>
                        )}
                    </div>
                </div>

                {app.articles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-secondary))', backgroundColor: 'hsl(var(--color-surface))', borderRadius: 'var(--radius-sm)' }}>
                        "AI 기사 추천 받기"를 눌러 관련 정보를 찾아보세요.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {app.articles.map(article => (
                            <div key={article.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                border: '1px solid hsl(var(--color-border))',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: article.selected ? 'hsl(225, 70%, 99%)' : 'hsl(var(--color-surface))'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={article.selected}
                                    onChange={() => dispatch({ type: 'TOGGLE_ARTICLE', payload: article.id })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    {editMode === article.id ? (
                                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                            <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className="input-field" />
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} placeholder="Source" className="input-field" style={{ width: '30%' }} />
                                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="URL" className="input-field" style={{ flex: 1 }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={saveEdit} className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>저장</button>
                                                <button onClick={() => setEditMode(null)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                                {article.title}
                                                <button onClick={() => startEditFn(article)} style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>수정</button>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 600 }}>{article.source}</span>
                                                <span>|</span>
                                                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'hsl(var(--color-primary))' }}>
                                                    Link <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {editMode === 'new' && (
                    <div style={{ marginTop: '12px', padding: '12px', border: '1px dashed hsl(var(--color-primary))', borderRadius: 'var(--radius-sm)' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>새 기사/자료 추가</h4>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="제목" className="input-field" />
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input value={editForm.source} onChange={e => setEditForm({ ...editForm, source: e.target.value })} placeholder="출처 (예: 네이버 뉴스)" className="input-field" style={{ width: '30%' }} />
                                <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="링크 URL" className="input-field" style={{ flex: 1 }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={saveEdit} className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>추가완료</button>
                                <button onClick={() => setEditMode(null)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>취소</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary & Thoughts Section */}
            {selectedArticles.length > 0 && (
                <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid hsl(var(--color-border))', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>2. 정보 요약 및 내 인사이트</h3>

                    {/* Summary */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>선택한 자료 요약</label>
                            <button onClick={handleSummarize} disabled={summaryLoading} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                {app.articleSummary ? '요약 다시 생성' : 'AI 요약 생성'}
                            </button>
                        </div>
                        {summaryLoading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--color-text-secondary))', backgroundColor: 'hsl(var(--color-surface))' }}>요약 생성 중...</div>
                        ) : (
                            <textarea
                                value={app.articleSummary}
                                onChange={(e) => dispatch({ type: 'SET_ARTICLE_SUMMARY', payload: e.target.value })}
                                placeholder="AI가 선택된 기사를 요약해줍니다. 직접 수정하거나 입력할 수도 있습니다."
                                style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--color-border))', resize: 'vertical' }}
                            />
                        )}
                    </div>

                    {/* Thoughts */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                            내 생각 / 인사이트 (선택)
                            <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', marginLeft: '6px' }}>
                                - 이 정보에 대한 내 해석이나 경험을 더해주세요.
                            </span>
                        </label>
                        <textarea
                            value={app.userThoughts}
                            onChange={(e) => dispatch({ type: 'SET_USER_THOUGHTS', payload: e.target.value })}
                            placeholder="예) 이 기사에서 말하는 트렌드는 실제로 현장에서 느끼기엔..."
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--color-border))', resize: 'vertical' }}
                        />
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '1rem', paddingBottom: '2rem' }}>
                <button
                    onClick={() => dispatch({ type: 'SET_STEP', payload: 3 })}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--color-border))',
                        color: 'hsl(var(--color-text-secondary))'
                    }}
                >
                    이전
                </button>
                <button
                    className="btn-primary"
                    onClick={handleNext}
                    disabled={loading || selectedArticles.length === 0} // Block if no articles selected? Maybe optional? Let's verify requirement. "Professional positioning" assumes sources.
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {loading ? '글 작성 중...' : (
                        <>
                            최종 쓰레드 생성하기 <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
            {error && <p style={{ color: 'hsl(var(--color-error))', fontSize: '0.875rem', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
        </div>
    );
}
