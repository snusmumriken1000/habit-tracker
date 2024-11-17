<script lang="ts">
	import { onMount } from 'svelte';
	import type { Habit } from '$lib/types';
	import HabitForm from '$lib/components/HabitForm.svelte';
	import confetti from 'canvas-confetti';

	let habits: Habit[] = [];
	let isFormOpen = false;
	let editingHabit: Habit | undefined;
	let activeTab: 'habits' | 'stats' = 'habits';
	let selectedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式

	// 統計情報の型定義を追加
	interface Statistics {
		totalHabits: number;
		completedToday: number;
		totalStreak: number;
		averageStreak: number;
		bestStreak: number;
		completionRate: number;
	}

	// 統計情報の初期値を設定
	let statistics: Statistics = {
		totalHabits: 0,
		completedToday: 0,
		totalStreak: 0,
		averageStreak: 0,
		bestStreak: 0,
		completionRate: 0
	};

	// 日付操作用の関数
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'short'
		});
	}

	function changeDate(offset: number) {
		const date = new Date(selectedDate);
		date.setDate(date.getDate() + offset);
		selectedDate = date.toISOString().split('T')[0];
	}

	// 連続達成日数を計算
	function calculateStreak(habit: Habit): number {
		const today = new Date().toISOString().split('T')[0];
		const sortedCompletions = habit.completions
			.filter((c) => c.completed)
			.map((c) => c.date)
			.sort()
			.reverse();

		let streak = 0;
		let currentDate = new Date(today);

		while (true) {
			const dateStr = currentDate.toISOString().split('T')[0];
			if (!sortedCompletions.includes(dateStr)) {
				break;
			}
			streak++;
			currentDate.setDate(currentDate.getDate() - 1);
		}

		return streak;
	}

	// 特定の日付の習慣の完了状態を取得
	function getHabitCompletion(habit: Habit, date: string): boolean {
		return habit.completions.find((c) => c.date === date)?.completed ?? false;
	}

	// 月間カレンダー用の関数
	function getDaysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getMonthCalendarData(habit: Habit) {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth();
		const daysInMonth = getDaysInMonth(year, month);

		const calendarData = [];
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, month, day);
			const dateStr = date.toISOString().split('T')[0];
			const completed = habit.completions.find((c) => c.date === dateStr)?.completed ?? false;
			calendarData.push({
				date: dateStr,
				day,
				completed
			});
		}
		return calendarData;
	}

	// 統計情報の計算を更新（リアクティブに）
	$: {
		statistics = {
			totalHabits: habits.length,
			completedToday: habits.filter((h) => getHabitCompletion(h, selectedDate)).length,
			totalStreak: habits.reduce((sum, h) => sum + calculateStreak(h), 0),
			averageStreak: habits.length
				? Math.round(habits.reduce((sum, h) => sum + calculateStreak(h), 0) / habits.length)
				: 0,
			bestStreak: Math.max(...habits.map((h) => calculateStreak(h)), 0),
			completionRate: habits.length
				? Math.round(
						(habits.filter((h) => getHabitCompletion(h, selectedDate)).length / habits.length) * 100
					)
				: 0
		};
	}

	onMount(() => {
		// サンプルデータを更新
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
			.toISOString()
			.split('T')[0];

		habits = [
			{
				id: '1',
				title: '朝のストレッチ',
				description: '10分間のストレッチで一日を始める',
				frequency: {
					type: 'daily'
				},
				startDate: new Date(),
				streak: 1,
				completions: [
					{ date: yesterday, completed: true },
					{ date: today, completed: false }
				]
			}
		];
	});

	async function triggerCelebration() {
		try {
			const duration = 3000;
			const end = Date.now() + duration;

			// より安全な紙吹雪の実装
			const frame = () => {
				confetti({
					particleCount: 2,
					angle: 60,
					spread: 55,
					origin: { x: 0 },
					colors: ['#FF69B4', '#9370DB', '#4B0082']
				});

				confetti({
					particleCount: 2,
					angle: 120,
					spread: 55,
					origin: { x: 1 },
					colors: ['#87CEEB', '#FFD700', '#FFA500']
				});

				if (Date.now() < end) {
					requestAnimationFrame(frame);
				}
			};

			frame();
		} catch (error) {
			console.error('紙吹雪の表示に失敗しました:', error);
		}
	}

	function toggleHabit(habit: Habit) {
		const currentCompletion = habit.completions.find((c) => c.date === selectedDate);
		const wasCompleted = currentCompletion?.completed ?? false;

		// 完了状態を更新
		if (currentCompletion) {
			currentCompletion.completed = !currentCompletion.completed;
		} else {
			habit.completions = [...habit.completions, { date: selectedDate, completed: true }];
		}

		// ストリークを再計算
		habit.streak = calculateStreak(habit);

		// 完了時のアニメーション
		if (!wasCompleted) {
			triggerCelebration().catch(console.error);
			showCompletionMessage(habit);
		}

		habits = [...habits]; // Svelte の反応性のために再代入
	}

	let completionMessage = '';
	let isMessageVisible = false;

	function showCompletionMessage(habit: Habit) {
		const messages = [
			`すごい！${habit.title}を達成しました！🎉`,
			`素晴らしい！${habit.streak}日連続達成です！✨`,
			'その調子！継続は力なり！💪',
			'完璧です！今日も一歩前進！🌟',
			'よくがんばりました！🎊'
		];
		completionMessage = messages[Math.floor(Math.random() * messages.length)];
		isMessageVisible = true;

		// 3秒後にメッセージを非表示
		setTimeout(() => {
			isMessageVisible = false;
		}, 3000);
	}

	function handleSubmit(habitData: Omit<Habit, 'id' | 'streak' | 'completions'>) {
		if (editingHabit) {
			const index = habits.findIndex((h) => h.id === editingHabit?.id);
			if (index !== -1) {
				habits[index] = {
					...editingHabit,
					...habitData
				};
				habits = [...habits];
			}
			editingHabit = undefined;
		} else {
			const newHabit: Habit = {
				...habitData,
				id: crypto.randomUUID(),
				streak: 0,
				completions: []
			};
			habits = [...habits, newHabit];
		}
		isFormOpen = false;
	}

	function editHabit(habit: Habit) {
		editingHabit = habit;
		isFormOpen = true;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
	<div class="container mx-auto max-w-4xl px-4">
		<div class="mb-8 flex items-center justify-between">
			<h1
				class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent"
			>
				習慣トラッカー
			</h1>
			<button
				on:click={() => {
					editingHabit = undefined;
					isFormOpen = true;
				}}
				class="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
						clip-rule="evenodd"
					/>
				</svg>
				新しい習慣を追加
			</button>
		</div>

		<!-- タブメニュー -->
		<div class="mb-6 flex space-x-1 rounded-xl bg-gray-100 p-1">
			<button
				class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all {activeTab ===
				'habits'
					? 'bg-white text-gray-800 shadow'
					: 'text-gray-600 hover:bg-white/50 hover:text-gray-800'}"
				on:click={() => (activeTab = 'habits')}
			>
				習慣一覧
			</button>
			<button
				class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all {activeTab === 'stats'
					? 'bg-white text-gray-800 shadow'
					: 'text-gray-600 hover:bg-white/50 hover:text-gray-800'}"
				on:click={() => (activeTab = 'stats')}
			>
				達成状況
			</button>
		</div>

		{#if activeTab === 'habits'}
			<!-- 日付選択部分 -->
			<div
				class="mb-6 flex items-center justify-between rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4"
			>
				<button
					on:click={() => changeDate(-1)}
					class="rounded-full p-2 hover:bg-white/50"
					aria-label="前日"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<div class="text-center">
					<h2 class="text-xl font-semibold text-gray-800">{formatDate(selectedDate)}</h2>
					<p class="text-sm text-gray-500">
						{selectedDate === new Date().toISOString().split('T')[0] ? '今日' : ''}
					</p>
				</div>
				<button
					on:click={() => changeDate(1)}
					class="rounded-full p-2 hover:bg-white/50"
					aria-label="翌日"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			<!-- 習慣カードのデザインを改善 -->
			<div class="grid gap-4">
				{#each habits as habit}
					{@const isCompleted = getHabitCompletion(habit, selectedDate)}
					<div
						class="group relative overflow-hidden rounded-2xl p-6 shadow-md transition-all hover:shadow-lg {isCompleted
							? 'bg-gradient-to-r from-green-50 to-emerald-50'
							: 'bg-white hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50'}"
					>
						<div class="relative flex items-center justify-between">
							<div>
								<h2 class="text-2xl font-semibold text-gray-800">{habit.title}</h2>
								{#if habit.description}
									<p class="mt-1 text-gray-600">{habit.description}</p>
								{/if}
								<div class="mt-2 flex items-center gap-2">
									<span
										class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
									>
										🔥 {habit.streak}日連続
									</span>
									{#if isCompleted}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
										>
											✓ 完了済み
										</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-3">
								{#if isCompleted}
									<button
										class="flex items-center gap-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-all hover:bg-gray-200"
										on:click={() => toggleHabit(habit)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
										元に戻す
									</button>
								{:else}
									<button
										class="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
										on:click={() => toggleHabit(habit)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											/>
										</svg>
										完了にする
									</button>
								{/if}
								<button
									on:click={() => editHabit(habit)}
									class="rounded-full bg-gray-100 p-2 text-gray-600 transition-all hover:bg-gray-200"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-6">
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<!-- 既存の統計カード -->
					<div class="rounded-2xl bg-white p-6 shadow-md">
						<h3 class="text-lg font-medium text-gray-600">今日の達成率</h3>
						<div class="mt-2 flex items-baseline">
							<span class="text-3xl font-bold text-indigo-600">{statistics.completionRate}%</span>
							<span class="ml-2 text-sm text-gray-500"
								>完了: {statistics.completedToday}/{statistics.totalHabits}</span
							>
						</div>
					</div>

					<div class="rounded-2xl bg-white p-6 shadow-md">
						<h3 class="text-lg font-medium text-gray-600">最長継続日数</h3>
						<div class="mt-2 flex items-baseline">
							<span class="text-3xl font-bold text-purple-600">{statistics.bestStreak}</span>
							<span class="ml-2 text-sm text-gray-500">日間</span>
						</div>
					</div>

					<div class="rounded-2xl bg-white p-6 shadow-md">
						<h3 class="text-lg font-medium text-gray-600">平均継続日数</h3>
						<div class="mt-2 flex items-baseline">
							<span class="text-3xl font-bold text-indigo-600">{statistics.averageStreak}</span>
							<span class="ml-2 text-sm text-gray-500">日間</span>
						</div>
					</div>
				</div>

				<!-- 月間達成カレンダー -->
				{#each habits as habit}
					<div class="rounded-2xl bg-white p-6 shadow-md">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-800">{habit.title}</h3>
							<span class="text-sm text-gray-500"
								>{new Date().getFullYear()}年{new Date().getMonth() + 1}月</span
							>
						</div>
						<div class="grid grid-cols-7 gap-1">
							{#each ['日', '月', '火', '水', '木', '金', '土'] as dayLabel}
								<div class="text-center text-xs text-gray-500">{dayLabel}</div>
							{/each}

							<!-- 月初めの空白を追加 -->
							{#each Array(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) as _}
								<div />
							{/each}

							{#each getMonthCalendarData(habit) as day}
								<div
									class="aspect-square rounded p-1 text-center text-xs {day.completed
										? 'bg-green-100 text-green-800'
										: 'bg-gray-50 text-gray-400'}"
								>
									{day.day}
								</div>
							{/each}
						</div>
					</div>
				{/each}

				<!-- 習慣ごとの達成状況 -->
				<div class="rounded-2xl bg-white p-6 shadow-md">
					<h3 class="mb-4 text-lg font-medium text-gray-600">習慣別の達成状況</h3>
					<div class="space-y-4">
						{#each habits as habit}
							{@const currentStreak = calculateStreak(habit)}
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-gray-800">{habit.title}</p>
									<p class="text-sm text-gray-500">
										{currentStreak}日連続達成中
									</p>
								</div>
								<div class="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
									<div
										class="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
										style="width: {(currentStreak / (statistics.bestStreak || 1)) * 100}%"
									/>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- トースト通知 -->
	{#if isMessageVisible}
		<div
			class="animate-slide-in-right fixed right-4 top-4 z-50 rounded-lg bg-white p-4 shadow-lg"
			style="animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-out 2.5s"
		>
			<p class="text-lg font-medium text-gray-800">{completionMessage}</p>
		</div>
	{/if}
</div>

<style>
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.animate-slide-in-right {
		animation: slideIn 0.5s ease-out;
	}
</style>
