<script lang="ts">
	import type { Habit } from '$lib/types';

	const { habit, onSubmit, onClose } = $props<{
		habit?: Habit;
		onSubmit: (habit: Omit<Habit, 'id' | 'streak' | 'completed' | 'lastCompleted'>) => void;
		onClose: () => void;
	}>();

	let title = habit?.title ?? '';
	let description = habit?.description ?? '';

	function handleSubmit() {
		onSubmit({
			title,
			description,
			frequency: { type: 'daily' },
			startDate: new Date()
		});
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold text-gray-800">
			{habit ? '習慣を編集' : '新しい習慣を作成'}
		</h2>
		<button
			type="button"
			on:click={onClose}
			class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>

	<div>
		<label for="title" class="block text-sm font-medium text-gray-700">タイトル</label>
		<input
			type="text"
			id="title"
			bind:value={title}
			required
			placeholder="例：朝のストレッチ"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
		/>
	</div>

	<div>
		<label for="description" class="block text-sm font-medium text-gray-700">説明（任意）</label>
		<textarea
			id="description"
			bind:value={description}
			placeholder="例：10分間のストレッチで一日を始める"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
			rows="3"
		/>
	</div>

	<div class="flex justify-end gap-3">
		<button
			type="button"
			on:click={onClose}
			class="rounded-md bg-gray-100 px-6 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200"
		>
			キャンセル
		</button>
		<button
			type="submit"
			class="rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			{habit ? '更新' : '作成'}
		</button>
	</div>
</form>
