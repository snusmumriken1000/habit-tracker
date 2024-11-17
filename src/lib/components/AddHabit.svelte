<script lang="ts">
	import type { Habit } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		add: Habit;
	}>();

	let title = '';
	let description = '';
	let frequency = 'daily';

	function handleSubmit() {
		const newHabit: Habit = {
			id: crypto.randomUUID(),
			title,
			description,
			frequency: {
				type: frequency as 'daily' | 'weekly' | 'monthly'
			},
			startDate: new Date(),
			streak: 0,
			completed: false
		};

		dispatch('add', newHabit);
		title = '';
		description = '';
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
	<div>
		<label for="title" class="block text-sm font-medium text-gray-700">習慣名</label>
		<input
			type="text"
			id="title"
			bind:value={title}
			required
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
		/>
	</div>

	<div>
		<label for="description" class="block text-sm font-medium text-gray-700">説明（任意）</label>
		<textarea
			id="description"
			bind:value={description}
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
		></textarea>
	</div>

	<div>
		<label for="frequency" class="block text-sm font-medium text-gray-700">頻度</label>
		<select
			id="frequency"
			bind:value={frequency}
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
		>
			<option value="daily">毎日</option>
			<option value="weekly">毎週</option>
			<option value="monthly">毎月</option>
		</select>
	</div>

	<button
		type="submit"
		class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
	>
		習慣を追加
	</button>
</form>
