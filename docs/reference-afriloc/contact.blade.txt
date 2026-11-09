<div>
    @livewire('components.header')

    <div class="container mx-auto px-4 py-24">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold mb-8 text-center">{{ __('messages.contact.title') }}</h1>
            <p class="text-xl text-gray-600 mb-12 text-center">{{ __('messages.contact.subtitle') }}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-start">
                        <svg class="h-6 w-6 text-primary mr-4 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <div>
                            <h3 class="font-semibold mb-1">Email</h3>
                            <p class="text-gray-600">info@barka.com</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-start">
                        <svg class="h-6 w-6 text-primary mr-4 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <div>
                            <h3 class="font-semibold mb-1">{{ __('messages.contact.phone') }}</h3>
                            <p class="text-gray-600">+226 XX XX XX XX</p>
                        </div>
                    </div>
                </div>
            </div>

            @if($success)
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
                    <p>{{ __('messages.contact.success') }}</p>
                </div>
            @endif

            <form wire:submit="submit" class="bg-white p-8 rounded-lg shadow-md">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.contact.name') }}</label>
                        <input type="text" wire:model="name" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        @error('name') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.contact.email') }}</label>
                        <input type="email" wire:model="email" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        @error('email') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.contact.phone') }}</label>
                        <input type="text" wire:model="phone" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        @error('phone') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.contact.subject') }}</label>
                        <input type="text" wire:model="subject" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
                        @error('subject') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ __('messages.contact.message') }}</label>
                    <textarea wire:model="message" rows="6" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"></textarea>
                    @error('message') <span class="text-red-500 text-sm">{{ $message }}</span> @enderror
                </div>

                <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold">
                    {{ __('messages.contact.send') }}
                </button>
            </form>
        </div>
    </div>

    @livewire('components.footer')
</div>
