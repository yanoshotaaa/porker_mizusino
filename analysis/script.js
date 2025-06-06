// ---------- 詳細分析表示 ----------
function displayHandsAnalysis(hands) {
    const handsAnalysis = document.getElementById('handsAnalysis');
    let html = '<h3>🎯 詳細ハンド分析</h3>';

    hands.forEach(hand => {
        const feedback = generateFeedback(hand);
        const handStrength = evaluateHandStrength(hand.your_cards);

        html += '<div class="hand-card">';
        html += '<div class="hand-header">';
        html += '<div class="hand-title">ハンド #' + hand.hand_id + '</div>';
        html += '<div style="color: ' + (hand.result === 'win' ? '#4CAF50' : '#f44336') + '">';
        html += (hand.result === 'win' ? '勝利' : '敗北');
        html += '</div>';
        html += '</div>';

        html += '<div><strong>ポジション:</strong> ' + translatePosition(hand.position) + '</div>';
        html += '<div><strong>ホールカード:</strong></div>';
        html += '<div class="cards">';
        hand.your_cards.forEach(card => {
            html += '<div class="card ' + (isRedCard(card) ? 'red' : '') + '">' + card + '</div>';
        });
        html += '</div>';

        html += '<div><strong>コミュニティカード:</strong></div>';
        html += '<div class="cards">';
        hand.community_cards.forEach(card => {
            html += '<div class="card ' + (isRedCard(card) ? 'red' : '') + '">' + card + '</div>';
        });
        html += '</div>';

        html += '<div><strong>アクション:</strong></div>';
        html += '<div class="actions">';
        hand.actions.forEach(action => {
            html += '<span class="action-item">' + action.street + ': ' + action.action;
            if (action.amount) {
                html += ' ' + action.amount;
            }
            html += '</span>';
        });
        html += '</div>';

        if (hand.opponents && hand.opponents.length > 0) {
            const relevantOpponents = hand.opponents.filter(opponent => {
                const foldedPreflop = opponent.folded && opponent.actions &&
                    opponent.actions.some(action => action.street === 'preflop' && action.action === 'fold') &&
                    !opponent.actions.some(action => action.street !== 'preflop');
                return !foldedPreflop;
            });

            if (relevantOpponents.length > 0) {
                html += '<div><strong>相手プレイヤー:</strong></div>';
                html += '<div class="opponents-section">';
                relevantOpponents.forEach(opponent => {
                    html += '<div class="opponent-card">';
                    html += '<div class="opponent-header">';
                    html += '<strong>' + opponent.name + '</strong> ';
                    html += '<span class="opponent-position">(' + translatePosition(opponent.position) + ')</span>';
                    if (opponent.folded) {
                        html += '<span class="folded-indicator">フォールド</span>';
                    }
                    html += '</div>';

                    if (opponent.cards && opponent.cards.length > 0) {
                        html += '<div class="opponent-cards">';
                        html += '<strong>ハンド:</strong>';
                        html += '<div class="cards">';
                        opponent.cards.forEach(card => {
                            html += '<div class="card ' + (isRedCard(card) ? 'red' : '') + '">' + card + '</div>';
                        });
                        html += '</div>';
                        html += '</div>';
                    }

                    html += '<div class="opponent-info">';
                    html += '<div><strong>合計ベット:</strong> ' + opponent.total_bet + '</div>';
                    if (opponent.actions && opponent.actions.length > 0) {
                        html += '<div><strong>アクション:</strong></div>';
                        html += '<div class="actions">';
                        opponent.actions.forEach(action => {
                            html += '<span class="action-item">' + action.street + ': ' + action.action;
                            if (action.amount) {
                                html += ' ' + action.amount;
                            }
                            html += '</span>';
                        });
                        html += '</div>';
                    }
                    html += '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }
        }

        html += '<div class="feedback">';
        html += '<h4>🤖 AI フィードバック</h4>';
        html += '<p><strong>ハンドの強さ:</strong> ' + handStrength + '</p>';
        html += '<p>' + feedback + '</p>';
        html += generateRangeFeedback(hand);
        html += '</div>';
        html += '</div>';
    });

    handsAnalysis.innerHTML = html;
}

function isRedCard(card) {
    return card.includes('♥') || card.includes('♦') || card.includes('h') || card.includes('d');
}

function translatePosition(position) {
    const positions = {
        'button': 'ボタン',
        'small_blind': 'スモールブラインド',
        'big_blind': 'ビッグブラインド',
        'under_the_gun': 'アンダーザガン',
        'middle_position': 'ミドルポジション',
        'late_position': 'レイトポジション',
        'hijack': 'ハイジャック',
        'cutoff': 'カットオフ',
        'btn': 'ボタン',
        'sb': 'スモールブラインド',
        'bb': 'ビッグブラインド',
        'utg': 'アンダーザガン',
        'hj': 'ハイジャック',
        'co': 'カットオフ'
    };
    return positions[position?.toLowerCase()] || position;
}

function evaluateHandStrength(cards) {
    if (!cards || cards.length !== 2) return '不明';

    const convertedCards = cards.map(convertCardSuit);
    const ranks = convertedCards.map(card => card.slice(0, -1));
    const suits = convertedCards.map(card => card.slice(-1));

    const highCards = ['A', 'K', 'Q', 'J'];
    const pocketPairs = ranks[0] === ranks[1];
    const suited = suits[0] === suits[1];
    const highCard = ranks.some(rank => highCards.includes(rank));

    if (pocketPairs && highCards.includes(ranks[0])) {
        return 'プレミアムペア（非常に強い）';
    } else if (pocketPairs) {
        return 'ポケットペア（強い）';
    } else if (suited && highCard) {
        return 'スーテッドハイカード（中程度）';
    } else if (highCard) {
        return 'ハイカード（中程度）';
    } else {
        return '弱いハンド';
    }
}

function generateFeedback(hand) {
    const position = hand.position;
    const actions = hand.actions;
    const result = hand.result;

    if (!rangeData) {
        return '基本的なプレイでした。継続して学習していきましょう。';
    }

    const positionShort = translatePositionToShort(position);
    const normalizedHand = normalizeHand(hand.your_cards);
    const optimalRange = getOptimalRange(positionShort);

    if (!normalizedHand) {
        return 'ハンド情報が不完全です。';
    }

    let feedback = '';
    const preflopAction = actions.find(a => a.street === 'preflop');

    let handCategory = '';
    let recommendedActions = [];

    if (optimalRange.raise.includes(normalizedHand)) {
        handCategory = 'レイズ推奨';
        recommendedActions = ['raise'];
    } else if (optimalRange.raiseOrCall.includes(normalizedHand)) {
        handCategory = 'レイズかコール';
        recommendedActions = ['raise', 'call'];
    } else if (optimalRange.raiseOrFold.includes(normalizedHand)) {
        handCategory = 'レイズかフォールド';
        recommendedActions = ['raise', 'fold'];
    } else if (optimalRange.call.includes(normalizedHand)) {
        handCategory = 'コール推奨';
        recommendedActions = ['call'];
    } else {
        handCategory = 'フォールド推奨';
        recommendedActions = ['fold'];
    }

    if (preflopAction) {
        const actionType = preflopAction.action;

        if (recommendedActions.includes(actionType)) {
            feedback += normalizedHand + 'は' + positionShort + 'からの' + handCategory + 'ハンドで、' + actionType + 'は適切な判断でした。';
        } else {
            if (actionType === 'fold' && handCategory !== 'フォールド推奨') {
                feedback += normalizedHand + 'は' + handCategory + 'ハンドでしたが、フォールドは保守的でした。';
            } else if (actionType === 'raise' && handCategory === 'フォールド推奨') {
                feedback += normalizedHand + 'は弱いハンドでしたが、ポジションやテーブル状況によってはブラフとして有効な場合もあります。';
            } else if (actionType === 'call' && handCategory === 'レイズ推奨') {
                feedback += normalizedHand + 'はより積極的にレイズでバリューを取りに行けるハンドでした。';
            } else {
                feedback += normalizedHand + 'は' + handCategory + 'ハンドでした。';
            }
        }
    }

    if (position === 'button' || position === 'cutoff') {
        feedback += ' レイトポジションの利点を活かせています。';
    } else if (position === 'under_the_gun' && preflopAction && preflopAction.action === 'raise') {
        feedback += ' アーリーポジションからは強いハンドでの積極的なプレイが基本です。';
    }

    if (result === 'win') {
        feedback += ' 良いプレイで勝利を収めました！';
    }

    return feedback || 'バランスの取れたプレイでした。継続して学習していきましょう。';
}

function generateRangeFeedback(hand) {
    try {
        if (!rangeData) return '';

        const position = translatePositionToShort(hand.position);
        const normalizedHand = normalizeHand(hand.your_cards);
        const optimalRange = getOptimalRange(position);

        if (!normalizedHand) return '';

        let rangeFeedback = '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">';
        rangeFeedback += '<h5>📊 ハンドレンジ分析</h5>';

        const preflopAction = hand.actions.find(a => a.street === 'preflop');
        const actionType = preflopAction ? preflopAction.action : 'unknown';

        let handCategory = '';
        let recommendedActions = [];

        if (optimalRange.raise.includes(normalizedHand)) {
            handCategory = 'レイズ推奨';
            recommendedActions = ['raise'];
        } else if (optimalRange.raiseOrCall.includes(normalizedHand)) {
            handCategory = 'レイズかコール';
            recommendedActions = ['raise', 'call'];
        } else if (optimalRange.raiseOrFold.includes(normalizedHand)) {
            handCategory = 'レイズかフォールド';
            recommendedActions = ['raise', 'fold'];
        } else if (optimalRange.call.includes(normalizedHand)) {
            handCategory = 'コール推奨';
            recommendedActions = ['call'];
        } else {
            handCategory = 'フォールド推奨';
            recommendedActions = ['fold'];
        }

        rangeFeedback += '<p style="color: #ffffff;"><strong>' + normalizedHand + '</strong> は ' + position + ' からの<strong>' + handCategory + '</strong>ハンドです。';

        let actionFeedback = '';
        if (actionType === 'fold') {
            if (recommendedActions.includes('fold')) {
                actionFeedback = ' フォールドは適切な判断です！';
            } else {
                actionFeedback = ' このハンドでフォールドは保守的すぎました。' + recommendedActions.join('か') + 'を検討しましょう。';
            }
        } else if (actionType === 'raise') {
            if (recommendedActions.includes('raise')) {
                actionFeedback = ' レイズは良い判断です！';
            } else if (handCategory === 'コール推奨') {
                actionFeedback = ' レイズは少しアグレッシブでしたが、状況によっては有効です。';
            } else if (handCategory === 'フォールド推奨') {
                actionFeedback = ' このハンドでのレイズは推奨されません。';
            }
        } else if (actionType === 'call') {
            if (recommendedActions.includes('call')) {
                actionFeedback = ' コールは適切です！';
            } else if (handCategory === 'レイズ推奨') {
                actionFeedback = ' このハンドはレイズでバリューを取りに行くべきでした。';
            } else if (handCategory === 'フォールド推奨') {
                actionFeedback = ' このハンドでのコールは推奨されません。';
            }
        }

        rangeFeedback += actionFeedback + '</p>';

        if (recommendedActions.length > 1) {
            rangeFeedback += '<p style="color: #ffffff;"><strong>推奨アクション:</strong> ' + recommendedActions.join(' または ');
            if (handCategory === 'レイズかフォールド') {
                rangeFeedback += '（状況に応じて極端な選択）';
            } else if (handCategory === 'レイズかコール') {
                rangeFeedback += '（アグレッションレベルを調整）';
            }
            rangeFeedback += '</p>';
        }

        rangeFeedback += '</div>';
        return rangeFeedback;
    } catch (error) {
        console.error('Range feedback error:', error);
        return '';
    }
}

function generateDetailedRangeStats(hands) {
    if (!rangeData) return '';

    try {
        let statsHtml = '<div class="detailed-range-stats"><h3>🎯 詳細レンジ分析</h3>';

        const positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

        positions.forEach(position => {
            const positionHands = hands.filter(h => translatePositionToShort(h.position) === position);
            if (positionHands.length === 0) return;

            const optimalRange = getOptimalRange(position);
            const analysis = analyzePositionCompliance(positionHands, optimalRange);

            statsHtml += '<div class="position-detailed-stats">';
            statsHtml += '<h4>' + position + ' - ' + translatePosition(position.toLowerCase()) + ' (' + positionHands.length + 'ハンド)</h4>';

            statsHtml += '<div class="compliance-stats">';
            statsHtml += '<div class="stat-row">';
            statsHtml += '<span class="stat-label">レンジ内プレイ:</span>';
            statsHtml += '<span class="stat-value" style="color: #4CAF50;">' + analysis.correct + 'ハンド (' + analysis.correctPercent + '%)</span>';
            statsHtml += '</div>';
            statsHtml += '<div class="stat-row">';
            statsHtml += '<span class="stat-label">レンジ外プレイ:</span>';
            statsHtml += '<span class="stat-value" style="color: #f44336;">' + analysis.tooLoose + 'ハンド (' + analysis.tooLoosePercent + '%)</span>';
            statsHtml += '</div>';
            statsHtml += '<div class="stat-row">';
            statsHtml += '<span class="stat-label">アクション適切率:</span>';
            statsHtml += '<span class="stat-value" style="color: #2196F3;">' + analysis.actionAccuracy + '%</span>';
            statsHtml += '</div>';
            statsHtml += '</div>';

            if (analysis.recommendations.length > 0) {
                statsHtml += '<div class="recommendations">';
                statsHtml += '<strong>改善提案:</strong>';
                statsHtml += '<ul>';
                analysis.recommendations.forEach(rec => {
                    statsHtml += '<li>' + rec + '</li>';
                });
                statsHtml += '</ul>';
                statsHtml += '</div>';
            }
            statsHtml += '</div>';
        });

        statsHtml += '</div>';
        return statsHtml;
    } catch (error) {
        console.error('Detailed range stats error:', error);
        return '<div class="detailed-range-stats"><p>詳細統計の生成でエラーが発生しました。</p></div>';
    }
}

function analyzePositionCompliance(positionHands, optimalRange) {
    let correct = 0;
    let tooLoose = 0;
    const playedHands = positionHands.map(h => normalizeHand(h.your_cards)).filter(h => h);
    const allRecommendedHands = [
        ...optimalRange.raise,
        ...optimalRange.raiseOrCall,
        ...optimalRange.raiseOrFold,
        ...optimalRange.call
    ];

    playedHands.forEach(hand => {
        if (allRecommendedHands.includes(hand)) {
            correct++;
        } else {
            tooLoose++;
        }
    });

    let correctActions = 0;
    let incorrectActions = 0;

    positionHands.forEach(hand => {
        const normalizedHand = normalizeHand(hand.your_cards);
        const preflopAction = hand.actions.find(a => a.street === 'preflop');
        const actionType = preflopAction ? preflopAction.action : 'unknown';

        let isCorrectAction = false;

        if (optimalRange.raise.includes(normalizedHand) && actionType === 'raise') {
            isCorrectAction = true;
        } else if (optimalRange.raiseOrCall.includes(normalizedHand) && (actionType === 'raise' || actionType === 'call')) {
            isCorrectAction = true;
        } else if (optimalRange.raiseOrFold.includes(normalizedHand) && (actionType === 'raise' || actionType === 'fold')) {
            isCorrectAction = true;
        } else if (optimalRange.call.includes(normalizedHand) && actionType === 'call') {
            isCorrectAction = true;
        } else if (!allRecommendedHands.includes(normalizedHand) && actionType === 'fold') {
            isCorrectAction = true;
        }

        if (isCorrectAction) {
            correctActions++;
        } else {
            incorrectActions++;
        }
    });

    const missedRaiseOpportunities = optimalRange.raise.filter(hand => !playedHands.includes(hand)).length;

    const total = positionHands.length;
    const correctPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const tooLoosePercent = total > 0 ? Math.round((tooLoose / total) * 100) : 0;
    const actionAccuracy = total > 0 ? Math.round((correctActions / total) * 100) : 0;

    const recommendations = [];
    if (tooLoosePercent > 30) {
        recommendations.push('レンジ外のハンドをプレイしすぎています。より選択的にハンドを選びましょう。');
    }
    if (actionAccuracy < 60) {
        recommendations.push('ハンドに対するアクション選択を見直しましょう。レイズ・コール・フォールドの使い分けが重要です。');
    }
    if (correctPercent > 80 && actionAccuracy > 80) {
        recommendations.push('優秀なレンジ管理とアクション選択ができています！この調子を維持してください。');
    }

    return {
        correct,
        tooLoose,
        missedOpportunities: missedRaiseOpportunities,
        correctPercent,
        tooLoosePercent,
        actionAccuracy,
        recommendations
    };
}

function generatePreflopActionReport(hands) {
    let html = '<div class="preflop-action-report" style="margin-top: 30px; background: rgba(255, 255, 255, 0.05); border-radius: 15px; padding: 25px;">';
    html += '<h3>📋 プリフロップアクション分析</h3>';

    const actionStats = {
        raise: hands.filter(h => h.actions.some(a => a.street === 'preflop' && a.action === 'raise')).length,
        call: hands.filter(h => h.actions.some(a => a.street === 'preflop' && a.action === 'call')).length,
        fold: hands.filter(h => h.actions.some(a => a.street === 'preflop' && a.action === 'fold')).length,
        check: hands.filter(h => h.actions.some(a => a.street === 'preflop' && a.action === 'check')).length
    };

    const total = hands.length;

    html += '<div class="action-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">';

    Object.entries(actionStats).forEach(([action, count]) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
        html += '<div class="action-stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; text-align: center;">';
        html += '<div style="font-size: 1.5rem; font-weight: bold; color: #ffd700;">' + count + '</div>';
        html += '<div style="font-size: 0.9rem; opacity: 0.8;">' + action.toUpperCase() + ' (' + percent + '%)</div>';
        html += '</div>';
    });

    html += '</div>';

    const raisePercent = total > 0 ? (actionStats.raise / total) * 100 : 0;

    html += '<div class="action-analysis" style="margin-top: 20px;">';
    html += '<h4>📊 アクション傾向</h4>';

    if (raisePercent > 25) {
        html += '<p style="color: #ff9800;">⚠️ レイズ頻度が高めです(' + raisePercent.toFixed(1) + '%)。より選択的なプレイを心がけましょう。</p>';
    } else if (raisePercent < 10) {
        html += '<p style="color: #2196F3;">💡 レイズ頻度が低めです(' + raisePercent.toFixed(1) + '%)。強いハンドでより積極的にプレイできます。</p>';
    } else {
        html += '<p style="color: #4CAF50;">✅ バランスの取れたアクション頻度です(' + raisePercent.toFixed(1) + '%)。</p>';
    }

    html += '</div>';
    html += '</div>';

    return html;
}

// ---------- デモデータ読み込み ----------
function loadDemoData() {
    const demoData = {
        "hands": [
            {
                "hand_id": 1,
                "your_cards": ["A♥", "K♦"],
                "community_cards": ["Q♥", "J♣", "T♠", "9♥", "8♦"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "bet", "amount": 150 }
                ],
                "result": "win",
                "pot_size": 800
            },
            {
                "hand_id": 2,
                "your_cards": ["2♣", "7♠"],
                "community_cards": ["K♥", "Q♣", "J♠"],
                "position": "under_the_gun",
                "actions": [
                    { "street": "preflop", "action": "fold" }
                ],
                "result": "loss",
                "pot_size": 50
            },
            {
                "hand_id": 3,
                "your_cards": ["A♠", "A♦"],
                "community_cards": ["K♥", "Q♣", "J♠", "T♥", "9♣"],
                "position": "small_blind",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 200 },
                    { "street": "flop", "action": "bet", "amount": 300 },
                    { "street": "turn", "action": "bet", "amount": 500 }
                ],
                "result": "win",
                "pot_size": 1500
            }
        ]
    };

    gameData = demoData;
    alert('✅ デモデータを読み込みました。' + gameData.hands.length + 'ハンドを分析します。');
    analyzeHands();
}

function loadGTOData() {
    const gtoDemo = {
        "hands": [
            {
                "hand_id": 1,
                "your_cards": ["A♥", "K♦"],
                "community_cards": ["A♠", "K♦", "J♣"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "bet", "amount": 150 }
                ],
                "opponents": [
                    { "name": "Player1", "position": "big_blind", "folded": false }
                ],
                "result": "win",
                "pot_size": 800
            },
            {
                "hand_id": 2,
                "your_cards": ["Q♠", "Q♦"],
                "community_cards": ["Q♥", "Q♣", "J♠"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "bet", "amount": 200 }
                ],
                "opponents": [
                    { "name": "Player2", "position": "big_blind", "folded": false }
                ],
                "result": "win",
                "pot_size": 1200
            },
            {
                "hand_id": 3,
                "your_cards": ["K♠", "Q♦"],
                "community_cards": ["K♠", "J♦", "T♣"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "check" }
                ],
                "opponents": [
                    { "name": "Player3", "position": "big_blind", "folded": false }
                ],
                "result": "loss",
                "pot_size": 400
            },
            {
                "hand_id": 4,
                "your_cards": ["A♠", "T♦"],
                "community_cards": ["A♠", "T♦", "T♣"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "bet", "amount": 180 }
                ],
                "opponents": [
                    { "name": "Player4", "position": "big_blind", "folded": false }
                ],
                "result": "win",
                "pot_size": 900
            },
            {
                "hand_id": 5,
                "your_cards": ["7♠", "6♠"],
                "community_cards": ["8♥", "5♣", "4♦"],
                "position": "button",
                "actions": [
                    { "street": "preflop", "action": "raise", "amount": 100 },
                    { "street": "flop", "action": "bet", "amount": 120 }
                ],
                "opponents": [
                    { "name": "Player5", "position": "big_blind", "folded": true }
                ],
                "result": "win",
                "pot_size": 350
            }
        ]
    };

    if (!gtoData) {
        gtoData = [
            {
                "Tree": "AsKdJc",
                "Equity(*)": "56.233",
                "EV": 22.32,
                "Bet 100": "4.302",
                "Bet 50": "10.355",
                "Bet 30": "32.399",
                "Check": "52.944"
            },
            {
                "Tree": "QsQdJc",
                "Equity(*)": "55.727",
                "EV": 22.234,
                "Bet 100": "0.288",
                "Bet 50": "22.475",
                "Bet 30": "58.948",
                "Check": "18.289"
            },
            {
                "Tree": "KsJdTc",
                "Equity(*)": "55.5",
                "EV": 22.298,
                "Bet 100": "2.1",
                "Bet 50": "15.2",
                "Bet 30": "50.5",
                "Check": "32.2"
            },
            {
                "Tree": "AsTdTc",
                "Equity(*)": "54.8",
                "EV": 22.001,
                "Bet 100": "3.5",
                "Bet 50": "18.3",
                "Bet 30": "53.5",
                "Check": "24.7"
            },
            {
                "Tree": "8h5c4d",
                "Equity(*)": "52.1",
                "EV": 19.8,
                "Bet 100": "8.5",
                "Bet 50": "25.3",
                "Bet 30": "35.2",
                "Check": "31.0"
            }
        ];
    }

    gameData = gtoDemo;
    alert('✅ GTOデモデータを読み込みました。' + gameData.hands.length + 'ハンドをGTO分析します。');
    analyzeHands();
}
                // ---------- グローバル変数 ----------
let gameData = null;
let rangeData = null;
let gtoData = null;

// ---------- 定数 ----------
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// ---------- ユーティリティ ----------
function convertCardSuit(card) {
    if (!card || card.length < 2) return card;
    const suitMap = { '♠': '♠', '♣': '♣', '♥': '♥', '♦': '♦', 's': '♠', 'c': '♣', 'h': '♥', 'd': '♦' };
    const rank = card[0].toUpperCase();
    const lastChar = card.slice(-1);
    const suit = suitMap[lastChar] || lastChar;
    return rank + suit;
}

function normalizeHand(cards) {
    if (!cards || cards.length !== 2) return '';

    const convertedCards = cards.map(convertCardSuit);

    let r1 = convertedCards[0][0].toUpperCase();
    let s1 = convertedCards[0].slice(-1);
    let r2 = convertedCards[1][0].toUpperCase();
    let s2 = convertedCards[1].slice(-1);

    const suitToLetter = { '♠': 's', '♣': 'c', '♥': 'h', '♦': 'd' };
    s1 = suitToLetter[s1] || s1.toLowerCase();
    s2 = suitToLetter[s2] || s2.toLowerCase();

    const r1Index = RANK_ORDER.indexOf(r1);
    const r2Index = RANK_ORDER.indexOf(r2);

    if (r1Index > r2Index) {
        [r1, s1, r2, s2] = [r2, s2, r1, s1];
    }

    if (r1 === r2) return r1 + r2;

    if (s1 === s2) return r1 + r2 + 's';
    return r1 + r2 + 'o';
}

function normalizeHandStr(str) {
    if (!str) return '';
    str = str.trim().toUpperCase();

    if (/^[AKQJT98765432]{2}$/.test(str)) {
        return str;
    }

    if (/^[AKQJT98765432]{2}[SO]$/.test(str)) {
        const r1 = str[0];
        const r2 = str[1];
        const s = str[2].toLowerCase();

        const r1Index = RANK_ORDER.indexOf(r1);
        const r2Index = RANK_ORDER.indexOf(r2);

        if (r1 === r2) return r1 + r2;
        if (r1Index > r2Index) return r2 + r1 + s;
        return r1 + r2 + s;
    }

    return str;
}

function translatePositionToShort(pos) {
    const map = {
        'under_the_gun': 'UTG',
        'hijack': 'HJ',
        'cutoff': 'CO',
        'button': 'BTN',
        'small_blind': 'SB',
        'big_blind': 'BB',
        'utg': 'UTG',
        'hj': 'HJ',
        'co': 'CO',
        'btn': 'BTN',
        'sb': 'SB',
        'bb': 'BB'
    };
    return map[pos?.toLowerCase()] || pos?.toUpperCase() || 'UNKNOWN';
}

// ---------- ボード分析関数群 ----------
function normalizeBoard(treeString) {
    if (!treeString || treeString.length < 6) return '';

    const cards = [];
    for (let i = 0; i < 6; i += 2) {
        if (i + 1 < treeString.length) {
            cards.push(treeString[i] + treeString[i + 1].toLowerCase());
        }
    }

    cards.sort((a, b) => {
        const rankOrder = 'AKQJT98765432';
        return rankOrder.indexOf(a[0]) - rankOrder.indexOf(b[0]);
    });

    return cards.join('');
}

// ボードパターンを分析する関数
function analyzeBoardPattern(cards) {
    if (!cards || cards.length < 3) return null;

    const convertedCards = cards.map(convertCardSuit);
    const ranks = convertedCards.map(card => card[0]);
    const suits = convertedCards.map(card => card.slice(-1));

    // ランクの分析
    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    
    const hasPair = Object.values(rankCounts).some(count => count >= 2);
    const hasTrips = Object.values(rankCounts).some(count => count >= 3);

    // スートの分析
    const suitCounts = {};
    suits.forEach(suit => suitCounts[suit] = (suitCounts[suit] || 0) + 1);
    
    const flushDraws = Object.values(suitCounts).filter(count => count >= 2).length;
    const rainbow = Object.keys(suitCounts).length === 3;

    // ストレートドローの分析
    const rankValues = ranks.map(rank => {
        const order = 'AKQJT98765432';
        return order.indexOf(rank);
    }).sort((a, b) => a - b);

    const gaps = [
        rankValues[1] - rankValues[0],
        rankValues[2] - rankValues[1]
    ];
    
    const straightDraw = Math.max(...gaps) <= 4 && (rankValues[2] - rankValues[0]) <= 4;
    const connectedBoard = gaps.every(gap => gap <= 2);

    // ハイカードの分析
    const highCardCount = ranks.filter(rank => ['A', 'K', 'Q', 'J'].includes(rank)).length;
    const lowBoard = ranks.every(rank => !['A', 'K', 'Q', 'J', 'T'].includes(rank));

    return {
        hasPair,
        hasTrips,
        flushDraws,
        rainbow,
        straightDraw,
        connectedBoard,
        highCardCount,
        lowBoard,
        rankStructure: Object.values(rankCounts).sort((a, b) => b - a), // [2,1] for pair, [1,1,1] for high card
        suitStructure: Object.values(suitCounts).sort((a, b) => b - a)
    };
}

// データベースのボード文字列をパースする関数
function parseDBBoard(treeString) {
    if (!treeString || treeString.length < 6) return null;

    const cards = [];
    for (let i = 0; i < 6; i += 2) {
        if (i + 1 < treeString.length) {
            const rank = treeString[i];
            const suit = treeString[i + 1];
            cards.push(rank + suit);
        }
    }
    return cards;
}

// ボード類似度を計算する関数
function calculateBoardSimilarity(pattern1, pattern2) {
    if (!pattern1 || !pattern2) return 0;

    let score = 0;
    let totalWeight = 0;

    // ペア/トリップス構造の比較（重要度: 高）
    const weight1 = 0.25;
    if (pattern1.hasPair === pattern2.hasPair) score += weight1;
    if (pattern1.hasTrips === pattern2.hasTrips) score += weight1;
    totalWeight += weight1 * 2;

    // フラッシュドロー構造の比較（重要度: 高）
    const weight2 = 0.2;
    if (pattern1.flushDraws === pattern2.flushDraws) score += weight2;
    if (pattern1.rainbow === pattern2.rainbow) score += weight2;
    totalWeight += weight2 * 2;

    // ストレートドロー構造の比較（重要度: 高）
    const weight3 = 0.15;
    if (pattern1.straightDraw === pattern2.straightDraw) score += weight3;
    if (pattern1.connectedBoard === pattern2.connectedBoard) score += weight3;
    totalWeight += weight3 * 2;

    // ハイカード構造の比較（重要度: 中）
    const weight4 = 0.1;
    if (Math.abs(pattern1.highCardCount - pattern2.highCardCount) <= 1) score += weight4;
    if (pattern1.lowBoard === pattern2.lowBoard) score += weight4;
    totalWeight += weight4 * 2;

    // ランク構造の比較（重要度: 中）
    const weight5 = 0.1;
    if (JSON.stringify(pattern1.rankStructure) === JSON.stringify(pattern2.rankStructure)) {
        score += weight5;
    }
    totalWeight += weight5;

    return totalWeight > 0 ? score / totalWeight : 0;
}

// 類似ボードを検索する関数
function findSimilarBoard(targetFlop) {
    if (!gtoData) return null;

    const targetPattern = analyzeBoardPattern(targetFlop);
    let bestMatch = null;
    let bestScore = -1;

    gtoData.forEach(row => {
        const dbBoard = parseDBBoard(row.Tree);
        if (!dbBoard || dbBoard.length < 3) return;

        const dbPattern = analyzeBoardPattern(dbBoard);
        const similarity = calculateBoardSimilarity(targetPattern, dbPattern);

        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = { ...row, isExactMatch: false, similarityScore: similarity };
        }
    });

    // 類似度が一定以上の場合のみ返す（50%以上）
    return bestScore >= 0.5 ? bestMatch : null;
}

// ---------- データ読み込み ----------
document.addEventListener('DOMContentLoaded', function () {
    fetch('hands.csv')
        .then(response => response.text())
        .then(csvContent => {
            const parsed = Papa.parse(csvContent, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';']
            });
            rangeData = parsed.data.filter(row =>
                row.myPosition &&
                ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].includes(row.myPosition) &&
                row.hands &&
                row.color
            );
            console.log('ハンドレンジデータを読み込みました:', rangeData.length, '行');
        })
        .catch(error => {
            console.error('CSVの読み込みエラー:', error);
            rangeData = null;
        });

    fetch('BTNBB.csv')
        .then(response => response.text())
        .then(csvContent => {
            const parsed = Papa.parse(csvContent, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', '|', ';']
            });
            gtoData = parsed.data.filter(row =>
                row.Tree &&
                row['EV'] !== null &&
                row['EV'] !== undefined
            );
            console.log('GTOデータを読み込みました:', gtoData.length, '行');
        })
        .catch(error => {
            console.error('GTO CSVの読み込みエラー:', error);
            gtoData = null;
        });

    document.getElementById('fileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const rawData = JSON.parse(e.target.result);

                    if (rawData.hands && Array.isArray(rawData.hands) && rawData.hands.length > 0 && rawData.hands[0].gameInfo) {
                        gameData = convertDetailedHistoryFormat(rawData);
                        alert('✅ 詳細履歴フォーマットを検出しました。' + gameData.hands.length + 'ハンドを変換しました。');
                    }
                    else if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].players) {
                        gameData = convertOriginalFormat(rawData);
                        alert('✅ 旧ゲームアプリのフォーマットを検出しました。' + gameData.hands.length + 'ハンドを変換しました。');
                    }
                    else if (rawData.games && Array.isArray(rawData.games)) {
                        gameData = convertOriginalFormat(rawData);
                        alert('✅ 新ゲームアプリのフォーマットを検出しました。' + gameData.hands.length + 'ハンドを変換しました。');
                    }
                    else if (rawData.hands && Array.isArray(rawData.hands) && rawData.hands.length > 0 && rawData.hands[0].hand_id) {
                        gameData = rawData;
                        alert('✅ 分析用フォーマットを読み込みました。' + gameData.hands.length + 'ハンドを処理します。');
                    }
                    else {
                        throw new Error('サポートされていないJSONフォーマットです。');
                    }

                    analyzeHands();
                } catch (error) {
                    alert('JSONファイルの処理中にエラーが発生しました: ' + error.message);
                    console.error('JSON parsing error:', error);
                }
            };
            reader.readAsText(file);
        } else {
            alert('JSONファイルを選択してください');
        }
    });
});

// ---------- レンジ取得 ----------
function getOptimalRange(position) {
    if (!rangeData) {
        return { raise: [], raiseOrCall: [], raiseOrFold: [], call: [] };
    }

    const rows = rangeData.filter(row => row.myPosition === position);
    const raise = [], raiseOrCall = [], raiseOrFold = [], call = [];

    for (const row of rows) {
        if (row.hands) {
            const hands = row.hands.split(',').map(h => normalizeHandStr(h.trim())).filter(Boolean);

            if (row.color === 'red') raise.push(...hands);
            else if (row.color === 'yellow') raiseOrCall.push(...hands);
            else if (row.color === 'blue') raiseOrFold.push(...hands);
            else if (row.color === 'green') call.push(...hands);
        }
    }

    return { raise, raiseOrCall, raiseOrFold, call };
}

// ---------- GTO適用性チェック ----------
function checkGTOApplicability(hands) {
    const applicableHands = hands.filter(hand => {
        const isBTN = translatePositionToShort(hand.position) === 'BTN';
        const hasFlop = hand.community_cards && hand.community_cards.length >= 3;
        const hasBBOpponent = checkBBOpponent(hand);
        const hasFlopAction = hand.actions && hand.actions.some(a => a.street === 'flop');

        return isBTN && hasFlop && (hasBBOpponent || hands.length <= 10) && hasFlopAction;
    });

    console.log('GTO適用可能ハンド:', applicableHands.length + '/' + hands.length);
    return applicableHands;
}

function checkBBOpponent(hand) {
    if (hand.opponents && hand.opponents.length > 0) {
        return hand.opponents.some(opponent =>
            translatePositionToShort(opponent.position) === 'BB'
        );
    }
    return true;
}

function displayGTOAvailability(applicableCount, totalCount) {
    const gtoAnalysisEl = document.getElementById('gtoAnalysis');

    if (!gtoData) {
        gtoAnalysisEl.innerHTML =
            '<h3>🧠 GTO戦略分析</h3>' +
            '<div class="gto-unavailable">' +
            '<p>📁 BTNBB.csvファイルが見つかりません。</p>' +
            '<p>GTOデータをアップロードすると、より詳細な戦略分析が可能になります。</p>' +
            '</div>';
        return;
    }

    if (applicableCount === 0) {
        gtoAnalysisEl.innerHTML =
            '<h3>🧠 GTO戦略分析</h3>' +
            '<div class="gto-unavailable">' +
            '<p>🎯 現在のデータはBTN vs BB フロップシチュエーションに適合しません。</p>' +
            '<p><strong>GTO分析に必要な条件：</strong></p>' +
            '<ul>' +
            '<li>✅ ボタンポジション（BTN）でのプレイ</li>' +
            '<li>✅ フロップ（3枚のコミュニティカード）が配られている</li>' +
            '<li>✅ フロップでアクション（ベット、チェック等）を行っている</li>' +
            '<li>✅ ビッグブラインド（BB）との対戦</li>' +
            '</ul>' +
            '<p>💡 BTNポジションでフロップをプレイしたハンドをアップロードすると、GTO戦略との比較分析が可能になります。</p>' +
            '</div>';
    } else {
        gtoAnalysisEl.innerHTML =
            '<h3>🧠 GTO戦略分析</h3>' +
            '<div class="gto-partial">' +
            '<p>🎯 <strong>' + applicableCount + '/' + totalCount + '</strong> ハンドがGTO分析に適用可能です。</p>' +
            '<p>BTN vs BB フロップシチュエーションのハンドを分析します...</p>' +
            '</div>';
    }
}

// ---------- 分析実行 ----------
function analyzeHands() {
    if (!gameData || !gameData.hands) {
        alert('有効なハンドデータが見つかりません');
        return;
    }

    const hands = gameData.hands;
    const stats = calculateStats(hands);
    document.getElementById('analysisSection').style.display = 'block';
    displayStats(stats);

    const gtoApplicableHands = checkGTOApplicability(hands);
    if (gtoApplicableHands.length > 0 && gtoData) {
        analyzeGTOStrategy(hands);
    } else {
        displayGTOAvailability(gtoApplicableHands.length, hands.length);
    }

    analyzeHandRange(hands);
    displayHandsAnalysis(hands);
}

function calculateStats(hands) {
    const totalHands = hands.length;
    const wins = hands.filter(h => h.result === 'win').length;
    const winRate = ((wins / totalHands) * 100).toFixed(1);
    const totalPots = hands.reduce((sum, h) => sum + (h.pot_size || 0), 0);
    const avgPot = (totalPots / totalHands).toFixed(0);
    const preflopRaises = hands.filter(h =>
        h.actions.some(a => a.street === 'preflop' && a.action === 'raise')
    ).length;
    const aggression = ((preflopRaises / totalHands) * 100).toFixed(1);
    return { totalHands, winRate, avgPot, aggression };
}

function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    let html = '';
    html += '<div class="stat-card"><div class="stat-value">' + stats.totalHands + '</div><div class="stat-label">総ハンド数</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + stats.winRate + '%</div><div class="stat-label">勝率</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + stats.avgPot + '</div><div class="stat-label">平均ポット</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + stats.aggression + '%</div><div class="stat-label">プリフロップ攻撃性</div></div>';
    statsGrid.innerHTML = html;
}

// ---------- GTO分析 ----------
function createBoardString(cards) {
    if (!cards || cards.length < 3) return '';

    const normalizedCards = cards.map(card => {
        const convertedCard = convertCardSuit(card);
        return convertedCard[0] + convertedCard.slice(-1).toLowerCase();
    });

    normalizedCards.sort((a, b) => {
        const rankOrder = 'AKQJT98765432';
        return rankOrder.indexOf(a[0]) - rankOrder.indexOf(b[0]);
    });

    return normalizedCards.join('');
}

function getGTORecommendation(hand) {
    if (!gtoData || !hand.community_cards || hand.community_cards.length < 3) {
        return null;
    }

    const flop = hand.community_cards.slice(0, 3);
    const boardString = createBoardString(flop);

    // まず完全一致を試す
    let matchingBoard = gtoData.find(row => {
        const gtoBoard = normalizeBoard(row.Tree);
        return gtoBoard === boardString;
    });

    // 完全一致がない場合、類似ボードを検索
    if (!matchingBoard) {
        matchingBoard = findSimilarBoard(flop);
    }

    if (!matchingBoard) {
        return null;
    }

    const actions = {
        'Check': parseFloat(matchingBoard['Check']) || 0,
        'Bet 30%': parseFloat(matchingBoard['Bet 30']) || 0,
        'Bet 50%': parseFloat(matchingBoard['Bet 50']) || 0,
        'Bet 100%': parseFloat(matchingBoard['Bet 100']) || 0
    };

    const bestAction = Object.entries(actions).reduce((best, [action, frequency]) =>
        frequency > best.frequency ? { action, frequency } : best
        , { action: '', frequency: -1 });

    return {
        board: flop,
        boardString: boardString,
        equity: parseFloat(matchingBoard['Equity(*)']) || 0,
        ev: parseFloat(matchingBoard['EV']) || 0,
        bestAction: bestAction.action,
        bestFrequency: bestAction.frequency,
        allActions: actions,
        rawData: matchingBoard,
        isExactMatch: matchingBoard.isExactMatch !== false // 完全一致かどうかのフラグ
    };
}

function analyzeGTOStrategy(hands) {
    const gtoAnalysisEl = document.getElementById('gtoAnalysis');
    const applicableHands = checkGTOApplicability(hands);

    if (applicableHands.length === 0) {
        displayGTOAvailability(0, hands.length);
        return;
    }

    if (!gtoData) {
        displayGTOAvailability(applicableHands.length, hands.length);
        return;
    }

    let gtoHtml = '<h3>🧠 GTO戦略分析（BTN vs BB フロップ）</h3>';
    gtoHtml += '<div class="gto-summary-header">';
    gtoHtml += '<p>📊 分析対象: <strong>' + applicableHands.length + '</strong> ハンド（全' + hands.length + 'ハンド中）</p>';
    gtoHtml += '<p>💡 ボタンポジションでのフロップ戦略をGTO理論と比較分析します</p>';
    gtoHtml += '</div>';

    let analysisCount = 0;
    let optimalCount = 0;

    gtoHtml += '<div class="gto-board-grid">';

    applicableHands.forEach(hand => {
        const gtoRecommendation = getGTORecommendation(hand);
        if (gtoRecommendation) {
            analysisCount++;
            gtoHtml += generateGTOAnalysisCard(hand, gtoRecommendation);

            const flopAction = hand.actions.find(a => a.street === 'flop');
            if (flopAction) {
                const actualAction = translateActionToGTO(flopAction.action, flopAction.amount);
                if (actualAction === gtoRecommendation.bestAction) {
                    optimalCount++;
                }
            }
        }
    });

    gtoHtml += '</div>';

    if (analysisCount > 0) {
        gtoHtml += generateGTOSummary(applicableHands, analysisCount, optimalCount);
        gtoHtml += generateGTOInsights(applicableHands);
    } else {
        gtoHtml += '<div class="gto-partial-match" style="background: rgba(255, 167, 38, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">';
        gtoHtml += '<h4>🔍 類似ボード分析結果</h4>';
        gtoHtml += '<p>📊 分析対象の' + applicableHands.length + 'ハンドのうち、' + analysisCount + 'ハンドで類似ボードパターンによる分析を実行しました。</p>';
        gtoHtml += '<p>💡 完全一致するボードはありませんでしたが、類似性の高いボードパターンを基に戦略分析を提供しています。</p>';
        
        if (analysisCount < applicableHands.length) {
            gtoHtml += '<p style="color: #ff9800;">⚠️ ' + (applicableHands.length - analysisCount) + 'ハンドは類似度が低いため分析対象外となりました。</p>';
        }
        
        gtoHtml += '<div style="margin-top: 15px; padding: 10px; background: rgba(33, 150, 243, 0.2); border-radius: 5px;">';
        gtoHtml += '<strong>💭 類似分析の信頼性について:</strong><br>';
        gtoHtml += '類似度50%以上のボードパターンで分析を行っています。ペア、フラッシュドロー、ストレートドローなどの構造的特徴を重視して類似性を判定しています。';
        gtoHtml += '</div>';
        gtoHtml += '</div>';
    }

    gtoAnalysisEl.innerHTML = gtoHtml;
}

function generateGTOAnalysisCard(hand, gtoRec) {
    let html = '<div class="gto-board-card">';
    html += '<div class="gto-board-header">';
    html += '<span class="hand-title">ハンド #' + hand.hand_id + '</span>';
    html += '<span style="color: #BA68C8;">EV: ' + gtoRec.ev.toFixed(1) + '</span>';
    
    // 類似度表示
    if (!gtoRec.isExactMatch && gtoRec.similarityScore) {
        html += '<span style="color: #FFA726; font-size: 0.9rem; margin-left: 10px;">';
        html += '類似度: ' + (gtoRec.similarityScore * 100).toFixed(0) + '%';
        html += '</span>';
    }
    html += '</div>';

    html += '<div class="gto-board-cards">';
    gtoRec.board.forEach(card => {
        html += '<div class="card ' + (isRedCard(card) ? 'red' : '') + '">' + card + '</div>';
    });
    html += '</div>';

    // 完全一致でない場合の注釈
    if (!gtoRec.isExactMatch) {
        html += '<div style="background: rgba(255, 167, 38, 0.2); padding: 8px; border-radius: 5px; margin: 10px 0; font-size: 0.9rem;">';
        html += '💡 <strong>類似ボード分析:</strong> 完全一致するデータがないため、最も類似するボードパターンで分析しています';
        html += '</div>';
    }

    html += '<div class="gto-action-recommendation">';
    html += '<strong>GTO推奨:</strong> ' + gtoRec.bestAction + ' (' + gtoRec.bestFrequency.toFixed(1) + '%)';
    html += '</div>';

    const flopAction = hand.actions.find(a => a.street === 'flop');
    if (flopAction) {
        const actualAction = translateActionToGTO(flopAction.action, flopAction.amount);
        const isOptimal = actualAction === gtoRec.bestAction;

        html += '<div style="margin: 10px 0; padding: 10px; border-radius: 5px; background: ' +
            (isOptimal ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)') + ';">';
        html += '<strong>実際のアクション:</strong> ' + actualAction;
        html += '<br><strong>評価:</strong> ' + (isOptimal ? '✅ GTO最適' : '⚠️ GTO非最適');
        
        if (!gtoRec.isExactMatch) {
            html += '<br><span style="font-size: 0.9rem; opacity: 0.8;">※類似ボード分析による評価</span>';
        }
        html += '</div>';
    }

    html += '<div class="gto-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 15px 0;">';
    Object.entries(gtoRec.allActions).forEach(([action, frequency]) => {
        html += '<div class="gto-stat" style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px; text-align: center;">';
        html += '<div class="gto-stat-value" style="font-size: 1.2rem; font-weight: bold; color: #ffd700;">' + frequency.toFixed(1) + '%</div>';
        html += '<div style="font-size: 0.8rem; opacity: 0.9;">' + action + '</div>';
        html += '</div>';
    });
    html += '</div>';

    html += '</div>';
    return html;
}

function translateActionToGTO(action, amount) {
    if (action === 'check') return 'Check';
    if (action === 'bet') {
        if (amount && amount >= 80) return 'Bet 100%';
        if (amount && amount >= 40) return 'Bet 50%';
        return 'Bet 30%';
    }
    if (action === 'call') return 'Check';
    if (action === 'fold') return 'Check';
    return action;
}

function generateGTOSummary(applicableHands, analysisCount, optimalCount) {
    let html = '<div class="gto-summary" style="margin-top: 30px; background: rgba(156, 39, 176, 0.1); padding: 20px; border-radius: 10px;">';
    html += '<h4>📈 GTO適合性サマリー</h4>';

    const gtoCompliance = analysisCount > 0 ? ((optimalCount / analysisCount) * 100).toFixed(1) : '0';

    html += '<div class="compliance-stats">';
    html += '<div class="stat-row">';
    html += '<span class="stat-label">GTO分析対象:</span>';
    html += '<span class="stat-value">' + analysisCount + ' ハンド</span>';
    html += '</div>';
    html += '<div class="stat-row">';
    html += '<span class="stat-label">GTO最適プレイ:</span>';
    html += '<span class="stat-value" style="color: #4CAF50;">' + optimalCount + ' ハンド (' + gtoCompliance + '%)</span>';
    html += '</div>';
    html += '<div class="stat-row">';
    html += '<span class="stat-label">改善余地:</span>';
    html += '<span class="stat-value" style="color: #ff9800;">' + (analysisCount - optimalCount) + ' ハンド</span>';
    html += '</div>';
    html += '</div>';

    html += '<div class="gto-performance" style="margin: 15px 0; padding: 15px; border-radius: 8px; ';
    if (parseFloat(gtoCompliance) >= 80) {
        html += 'background: rgba(76, 175, 80, 0.2); border-left: 4px solid #4CAF50;">';
        html += '<strong>🏆 優秀</strong>: GTO理論に非常に近いプレイができています！';
    } else if (parseFloat(gtoCompliance) >= 60) {
        html += 'background: rgba(255, 193, 7, 0.2); border-left: 4px solid #FFC107;">';
        html += '<strong>📈 良好</strong>: 概ねGTOに沿ったプレイです。さらなる向上の余地があります。';
    } else {
        html += 'background: rgba(244, 67, 54, 0.2); border-left: 4px solid #f44336;">';
        html += '<strong>⚠️ 要改善</strong>: GTO理論との乖離が大きいです。戦略の見直しをお勧めします。';
    }
    html += '</div>';

    html += '<div class="recommendations" style="margin-top: 15px;">';
    html += '<strong>🎯 具体的な改善提案:</strong><ul>';

    if (parseFloat(gtoCompliance) < 60) {
        html += '<li><strong>フロップベッティング頻度の調整</strong>: GTOでは状況に応じてベット/チェックを使い分けます</li>';
        html += '<li><strong>ベットサイズの最適化</strong>: ポットサイズに対する適切なベット額（30%、50%、100%）を学習しましょう</li>';
        html += '<li><strong>ボードテクスチャの理解</strong>: ドロー系ボードとペア系ボードで戦略を変えましょう</li>';
    } else if (parseFloat(gtoCompliance) < 80) {
        html += '<li><strong>バランス調整</strong>: 強いハンドと弱いハンドの混合頻度を最適化しましょう</li>';
        html += '<li><strong>ポジション活用</strong>: BTNの有利性を最大限活かした積極的なプレイを心がけましょう</li>';
    } else {
        html += '<li><strong>継続性</strong>: 現在の高いGTO適合性を維持してください</li>';
        html += '<li><strong>応用</strong>: 他のポジションでも同様の理論的アプローチを適用しましょう</li>';
    }

    html += '</ul></div>';
    html += '</div>';
    return html;
}

function generateGTOInsights(applicableHands) {
    let html = '<div class="gto-insights" style="margin-top: 20px; background: rgba(33, 150, 243, 0.1); padding: 20px; border-radius: 10px;">';
    html += '<h4>💡 戦略的洞察</h4>';

    const actionPattern = {
        'Check': 0, 'Bet 30%': 0, 'Bet 50%': 0, 'Bet 100%': 0
    };

    const boardTypes = {
        'highCard': 0,
        'pair': 0,
        'draw': 0,
        'coordinated': 0
    };

    let analyzedHands = 0;

    applicableHands.forEach(hand => {
        const gtoRec = getGTORecommendation(hand);
        if (gtoRec) {
            analyzedHands++;
            actionPattern[gtoRec.bestAction]++;

            const boardType = analyzeBoardType(hand.community_cards.slice(0, 3));
            if (boardTypes[boardType] !== undefined) {
                boardTypes[boardType]++;
            }
        }
    });

    if (analyzedHands > 0) {
        html += '<div class="insight-section">';
        html += '<h5>🎯 推奨アクションパターン</h5>';
        html += '<div class="action-insights">';

        const sortedActions = Object.entries(actionPattern)
            .sort(([, a], [, b]) => b - a)
            .filter(([, count]) => count > 0);

        sortedActions.forEach(([action, count]) => {
            const percentage = ((count / analyzedHands) * 100).toFixed(1);
            html += '<div class="insight-item">';
            html += '<strong>' + action + '</strong>: ' + count + '回 (' + percentage + '%)';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';

        html += '<div class="insight-section">';
        html += '<h5>🃏 ボードテクスチャ分析</h5>';
        html += '<div class="board-insights">';

        const totalBoards = Object.values(boardTypes).reduce((a, b) => a + b, 0);
        Object.entries(boardTypes).forEach(([type, count]) => {
            if (count > 0) {
                const percentage = ((count / totalBoards) * 100).toFixed(1);
                const typeNames = {
                    'highCard': 'ハイカードボード',
                    'pair': 'ペアボード',
                    'draw': 'ドローボード',
                    'coordinated': 'コーディネートボード'
                };
                html += '<div class="insight-item">';
                html += '<strong>' + typeNames[type] + '</strong>: ' + count + '回 (' + percentage + '%)';
                html += '</div>';
            }
        });
        html += '</div>';
        html += '</div>';

        html += '<div class="insight-section">';
        html += '<h5>📚 戦略学習ポイント</h5>';
        html += '<div class="learning-points">';

        const checkFreq = actionPattern['Check'] / analyzedHands;
        const aggBetFreq = (actionPattern['Bet 50%'] + actionPattern['Bet 100%']) / analyzedHands;

        if (checkFreq > 0.6) {
            html += '<p>📖 <strong>チェック重視戦略</strong>: BTNからでもポットコントロールを重視する場面が多いです。相手の反応を見てからターンで行動する戦略的アプローチです。</p>';
        }

        if (aggBetFreq > 0.3) {
            html += '<p>🔥 <strong>アグレッシブベット</strong>: 大きなベットサイズでバリューとブラフのバランスを取る高度な戦略です。ポジションアドバンテージを最大活用しています。</p>';
        }

        if (boardTypes.draw > boardTypes.pair) {
            html += '<p>🌊 <strong>ドロー系ボード対応</strong>: コネクテッドボードでの適切な対応が重要です。相手のドローを拒否しつつ、自分のエクイティを守りましょう。</p>';
        }

        html += '</div>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function analyzeBoardType(flop) {
    if (!flop || flop.length < 3) return 'unknown';

    const ranks = flop.map(card => convertCardSuit(card)[0]);
    const suits = flop.map(card => convertCardSuit(card).slice(-1));

    const rankCounts = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const hasPair = Object.values(rankCounts).some(count => count >= 2);

    if (hasPair) return 'pair';

    const suitCounts = {};
    suits.forEach(suit => suitCounts[suit] = (suitCounts[suit] || 0) + 1);
    const hasFlushDraw = Object.values(suitCounts).some(count => count >= 2);

    const rankValues = ranks.map(rank => {
        const order = 'AKQJT98765432';
        return order.indexOf(rank);
    }).sort((a, b) => a - b);

    const hasStraightDraw = (rankValues[2] - rankValues[0]) <= 4;

    if (hasFlushDraw || hasStraightDraw) {
        return 'draw';
    }

    if (hasStraightDraw || hasFlushDraw) {
        return 'coordinated';
    }

    return 'highCard';
}

// ---------- ハンドレンジ分析 ----------
async function analyzeHandRange(hands) {
    try {
        if (!rangeData) {
            document.getElementById('rangeAnalysis').innerHTML =
                '<h3>📊 プリフロップハンドレンジ分析</h3>' +
                '<p>hands.csvファイルをアップロードするとハンドレンジ分析が利用できます。</p>';
            return;
        }

        const rangeAnalysisEl = document.getElementById('rangeAnalysis');
        rangeAnalysisEl.innerHTML =
            '<h3>📊 プリフロップハンドレンジ分析</h3>' +
            '<div id="rangeResults"></div>';

        const positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        let analysisHtml = '';

        positions.forEach(position => {
            const positionHands = hands.filter(h => {
                const translatedPos = translatePositionToShort(h.position);
                return translatedPos === position;
            });

            if (positionHands.length > 0) {
                analysisHtml += generatePositionRangeAnalysis(position, positionHands);
            }
        });

        document.getElementById('rangeResults').innerHTML = analysisHtml;

        const detailedStats = generateDetailedRangeStats(hands);
        document.getElementById('rangeAnalysis').innerHTML += detailedStats;

    } catch (error) {
        console.error('Range analysis error:', error);
        document.getElementById('rangeAnalysis').innerHTML =
            '<h3>📊 プリフロップハンドレンジ分析</h3>' +
            '<p>分析中にエラーが発生しました: ' + error.message + '</p>';
    }

    document.getElementById('rangeAnalysis').innerHTML += generatePreflopActionReport(hands);
}

// ---------- プレイハンド取得 ----------
function getPlayedHands(hands) {
    const playedHands = hands.map(h => {
        if (!h.your_cards || h.your_cards.length !== 2) return '';
        const normalizedHand = normalizeHand(h.your_cards);
        return normalizedHand;
    }).filter(h => h);

    return playedHands;
}

// ---------- グリッド生成 ----------
function generateAllHands() {
    const hands = [];
    for (let i = 0; i < RANK_ORDER.length; i++) {
        for (let j = 0; j < RANK_ORDER.length; j++) {
            if (i === j) {
                hands.push(RANK_ORDER[i] + RANK_ORDER[j]);
            } else if (i < j) {
                hands.push(RANK_ORDER[i] + RANK_ORDER[j] + 's');
            } else {
                hands.push(RANK_ORDER[j] + RANK_ORDER[i] + 'o');
            }
        }
    }
    return hands;
}

function generateRangeGrid(optimalRange, playedHands) {
    const allHands = generateAllHands();
    const playedSet = new Set(playedHands);

    let gridHtml = '<div class="range-grid">';
    allHands.forEach(hand => {
        let cellClass = 'range-cell out-range';

        if (optimalRange.raise.includes(hand)) cellClass = 'range-cell raise-range';
        else if (optimalRange.raiseOrCall.includes(hand)) cellClass = 'range-cell raise-or-call-range';
        else if (optimalRange.raiseOrFold.includes(hand)) cellClass = 'range-cell raise-or-fold-range';
        else if (optimalRange.call.includes(hand)) cellClass = 'range-cell call-range';

        if (playedSet.has(hand)) {
            cellClass += ' played';
        }

        gridHtml += '<div class="' + cellClass + '" title="' + getHandDescription(hand, optimalRange) + '">' + hand + '</div>';
    });
    gridHtml += '</div>';
    return gridHtml;
}

function getHandDescription(hand, optimalRange) {
    if (optimalRange.raise.includes(hand)) return hand + ': レイズ推奨';
    else if (optimalRange.raiseOrCall.includes(hand)) return hand + ': レイズかコール';
    else if (optimalRange.raiseOrFold.includes(hand)) return hand + ': レイズかフォールド';
    else if (optimalRange.call.includes(hand)) return hand + ': コール推奨';
    else return hand + ': フォールド推奨';
}

function generatePositionRangeAnalysis(position, hands) {
    try {
        const playedHands = getPlayedHands(hands);
        const optimalRange = getOptimalRange(position);

        let html = '<div class="position-range-analysis">';
        html += '<h4>' + position + ' (' + translatePosition(position.toLowerCase()) + ')</h4>';
        html += '<div class="range-stats">';
        html += generateRangeStats(position, playedHands, optimalRange);
        html += '</div>';
        html += '<div class="range-grid-container">';
        html += generateRangeGrid(optimalRange, playedHands);
        html += '</div>';
        html += '<div class="range-legend">';
        html += '<div class="legend-item"><div class="legend-color" style="background: #f44336;"></div><span>レイズ</span></div>';
        html += '<div class="legend-item"><div class="legend-color" style="background: #FFEB3B; color: black;"></div><span>レイズかコール</span></div>';
        html += '<div class="legend-item"><div class="legend-color" style="background: #2196F3;"></div><span>レイズかフォールド</span></div>';
        html += '<div class="legend-item"><div class="legend-color" style="background: #4CAF50;"></div><span>コール</span></div>';
        html += '<div class="legend-item"><div class="legend-color" style="background: rgba(255,255,255,0.1);"></div><span>フォールド</span></div>';
        html += '<div class="legend-item"><div class="legend-color" style="background: transparent; border: 3px solid #FFD700;"></div><span>実際にプレイ</span></div>';
        html += '</div>';
        html += '</div>';
        return html;
    } catch (error) {
        console.error('Position range analysis error:', error);
        return '<div class="position-range-analysis"><p>ポジション ' + position + ' の分析でエラーが発生しました。</p></div>';
    }
}

function generateRangeStats(position, playedHands, optimalRange) {
    const totalPlayed = playedHands.length;
    const allRecommendedHands = [
        ...optimalRange.raise,
        ...optimalRange.raiseOrCall,
        ...optimalRange.raiseOrFold,
        ...optimalRange.call
    ];

    const inRange = playedHands.filter(hand => allRecommendedHands.includes(hand)).length;
    const tooLoose = playedHands.filter(hand => !allRecommendedHands.includes(hand)).length;
    const rangeCompliance = totalPlayed > 0 ? ((inRange / totalPlayed) * 100).toFixed(1) : '0';

    let html = '';
    html += '<div class="range-stat"><div class="range-stat-value">' + totalPlayed + '</div><div class="range-stat-label">プレイハンド数</div></div>';
    html += '<div class="range-stat"><div class="range-stat-value">' + rangeCompliance + '%</div><div class="range-stat-label">レンジ適合率</div></div>';
    html += '<div class="range-stat"><div class="range-stat-value">' + tooLoose + '</div><div class="range-stat-label">レンジ外プレイ</div></div>';
    return html;
}

// ---------- フォーマット変換 ----------
function convertOriginalFormat(originalData) {
    if (originalData.games && Array.isArray(originalData.games)) return convertNewFormat(originalData);
    if (!originalData || !Array.isArray(originalData)) throw new Error('元のフォーマットが正しくありません。配列である必要があります。');
    return convertOldFormat(originalData);
}

function convertDetailedHistoryFormat(data) {
    const convertedHands = data.hands.map(hand => {
        const userPlayer = hand.playerDetails.find(p => p.playerInfo.isUser || p.playerInfo.name === "あなた");
        if (!userPlayer) {
            console.warn('ハンド', hand.gameInfo.handNumber, 'でユーザープレイヤーが見つかりません');
            return null;
        }

        const convertCard = card => convertCardSuit(card);
        const convertPosition = pos => {
            const positionMap = {
                'UTG': 'under_the_gun',
                'HJ': 'hijack',
                'CO': 'cutoff',
                'BTN': 'button',
                'SB': 'small_blind',
                'BB': 'big_blind'
            };
            return positionMap[pos] || pos.toLowerCase();
        };

        const convertActions = arr => arr.map(action => ({
            street: { 'プリフロップ': 'preflop', 'フロップ': 'flop', 'ターン': 'turn', 'リバー': 'river' }[action.stage] || action.stage.toLowerCase(),
            action: action.action,
            amount: action.amount || 0
        }));

        const opponents = hand.playerDetails.filter(p => !p.playerInfo.isUser && p.playerInfo.name !== "あなた")
            .map(player => ({
                name: player.playerInfo.name,
                position: convertPosition(player.playerInfo.position),
                cards: player.handInfo.holeCards ? player.handInfo.holeCards.map(convertCard) : [],
                actions: convertActions(player.detailedActions || []),
                total_bet: player.actionSummary.totalAmountBet || 0,
                folded: player.handInfo.folded || false,
                showed_down: player.handInfo.showedDown || false
            }));

        let result = 'loss';
        if (hand.winnerInfo && hand.winnerInfo.winners) {
            const isWinner = hand.winnerInfo.winners.some(w =>
                w.name === userPlayer.playerInfo.name || w.isUser
            );
            result = isWinner ? 'win' : 'loss';
        } else if (userPlayer.chipInfo.profit && userPlayer.chipInfo.profit > 0) {
            result = 'win';
        } else {
            const activePlayers = hand.playerDetails.filter(p => !p.handInfo.folded);
            if (activePlayers.length === 1 && activePlayers[0].playerInfo.isUser) {
                result = 'win';
            }
        }

        const totalBets = hand.playerDetails.reduce((sum, player) => sum + (player.actionSummary.totalAmountBet || 0), 0);
        const totalAntes = hand.playerDetails.reduce((sum, player) => sum + (player.chipInfo.anteAndBlinds || 0), 0);
        const potSize = totalBets + totalAntes;

        return {
            hand_id: hand.gameInfo.handNumber,
            your_cards: userPlayer.handInfo.holeCards ? userPlayer.handInfo.holeCards.map(convertCard) : [],
            community_cards: hand.gameStats.boardCards ? hand.gameStats.boardCards.map(convertCard) : [],
            position: convertPosition(userPlayer.playerInfo.position),
            actions: convertActions(userPlayer.detailedActions || []),
            opponents: opponents,
            result: result,
            pot_size: potSize
        };
    }).filter(h => h !== null);

    return { hands: convertedHands };
}

function convertNewFormat(data) {
    const convertedHands = data.games.map(game => {
        const userPlayer = game.playerDetails.find(p => p.playerInfo.isUser || p.playerInfo.name === "あなた");
        const convertCard = card => convertCardSuit(card);
        const convertPosition = pos => ({ 'UTG': 'under_the_gun', 'HJ': 'hijack', 'CO': 'cutoff', 'BTN': 'button', 'SB': 'small_blind', 'BB': 'big_blind' }[pos] || pos.toLowerCase());
        const convertActions = arr => arr.map(action => ({
            street: { 'プリフロップ': 'preflop', 'フロップ': 'flop', 'ターン': 'turn', 'リバー': 'river' }[action.stage] || action.stage.toLowerCase(),
            action: action.action, amount: action.amount || 0
        }));
        const opponents = game.playerDetails.filter(p => !p.playerInfo.isUser && p.playerInfo.name !== "あなた")
            .map(player => ({
                name: player.playerInfo.name, position: convertPosition(player.playerInfo.position),
                cards: player.handInfo.holeCards ? player.handInfo.holeCards.map(convertCard) : [],
                actions: convertActions(player.detailedActions || []),
                total_bet: player.actionSummary.totalAmountBet || 0,
                folded: player.handInfo.folded || false,
                showed_down: player.handInfo.showedDown || false
            }));
        let result = 'loss';
        if (game.winnerInfo && game.winnerInfo.winners) {
            const isWinner = game.winnerInfo.winners.some(w =>
                w.name === userPlayer.playerInfo.name || userPlayer.playerInfo.isUser
            );
            result = isWinner ? 'win' : 'loss';
        } else if (userPlayer.chipInfo.profit && userPlayer.chipInfo.profit > 0) {
            result = 'win';
        }
        const totalBets = game.playerDetails.reduce((sum, player) => sum + (player.actionSummary.totalAmountBet || 0), 0);
        const totalAntes = game.playerDetails.reduce((sum, player) => sum + (player.chipInfo.anteAndBlinds || 0), 0);
        const potSize = totalBets + totalAntes;
        return {
            hand_id: game.gameInfo.gameNumber,
            your_cards: userPlayer.handInfo.holeCards ? userPlayer.handInfo.holeCards.map(convertCard) : [],
            community_cards: game.gameStats.boardCards ? game.gameStats.boardCards.map(convertCard) : [],
            position: convertPosition(userPlayer.playerInfo.position),
            actions: convertActions(userPlayer.detailedActions || []),
            opponents: opponents,
            result: result,
            pot_size: potSize
        };
    });
    return { hands: convertedHands };
}

function convertOldFormat(originalData) {
    const convertedHands = originalData.map((gameHistory, index) => {
        if (!gameHistory.players || !gameHistory.board) throw new Error('ゲーム' + (index + 1) + 'のデータが不完全です。');
        const userPlayer = gameHistory.players.find(p => p.isUser || p.name === "あなた");
        if (!userPlayer) throw new Error('ゲーム' + (index + 1) + 'でユーザープレイヤーが見つかりません。');
        const convertCard = card => convertCardSuit(card);
        const convertPosition = pos => {
            const positionMap = {
                'UTG': 'under_the_gun', 'HJ': 'hijack', 'CO': 'cutoff',
                'BTN': 'button', 'SB': 'small_blind', 'BB': 'big_blind'
            };
            return positionMap[pos] || pos.toLowerCase();
        };
        const convertActions = playerActions => {
            const streetMap = { 'プリフロップ': 'preflop', 'フロップ': 'flop', 'ターン': 'turn', 'リバー': 'river' };
            return playerActions.map(action => ({
                street: streetMap[action.stage] || action.stage.toLowerCase(),
                action: action.action,
                amount: action.amount || 0
            }));
        };
        const opponents = gameHistory.players
            .filter(p => !p.isUser && p.name !== "あなた")
            .map(player => ({
                name: player.name,
                position: convertPosition(player.position),
                cards: player.hand ? player.hand.map(convertCard) : [],
                actions: convertActions(player.actions || []),
                total_bet: player.totalBet || 0,
                folded: player.folded || false,
                showed_down: player.showedDown || false
            }));
        let result = 'loss';
        if (gameHistory.showdownResult && gameHistory.showdownResult.winners) {
            const isWinner = gameHistory.showdownResult.winners.some(w =>
                w.name === userPlayer.name || w.isUser
            );
            result = isWinner ? 'win' : 'loss';
        } else if (gameHistory.profit && gameHistory.profit > 0) {
            result = 'win';
        }
        return {
            hand_id: index + 1,
            your_cards: userPlayer.hand ? userPlayer.hand.map(convertCard) : [],
            community_cards: gameHistory.board ? gameHistory.board.map(convertCard) : [],
            position: convertPosition(userPlayer.position),
            actions: convertActions(userPlayer.actions || []),
            opponents: opponents,
            result: result,
            pot_size: gameHistory.pot || 0
        };
    });
    return { hands: convertedHands };
}

// ----------