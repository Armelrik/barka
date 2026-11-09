<div>
    @if($showModal)
        <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" wire:click="closeModal"></div>
            
            <!-- Center content -->
            <div class="flex min-h-screen items-center justify-center p-4">
                <!-- Modal panel -->
                <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-50">
                    <!-- Close button -->
                    <button type="button" wire:click="closeModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none">
                        <span class="sr-only">{{ __('messages.common.close') }}</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div class="w-full">
                                <h3 class="text-2xl leading-6 font-bold text-gray-900 mb-6" id="modal-title">
                                    {{ __('messages.auth.login') }}
                                </h3>

                                <form wire:submit.prevent="login" class="space-y-6">
                                    <!-- Email -->
                                    <div>
                                        <label for="email" class="block text-sm font-medium text-gray-700">
                                            {{ __('messages.auth.email') }}
                                        </label>
                                        <input type="email" id="email" wire:model="email" 
                                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm @error('email') border-red-500 @enderror">
                                        @error('email') 
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <!-- Password -->
                                    <div>
                                        <label for="password" class="block text-sm font-medium text-gray-700">
                                            {{ __('messages.auth.password') }}
                                        </label>
                                        <input type="password" id="password" wire:model="password" 
                                               class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm @error('password') border-red-500 @enderror">
                                        @error('password') 
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <!-- Remember me -->
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <input type="checkbox" id="remember" wire:model="remember" 
                                                   class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                                            <label for="remember" class="ml-2 block text-sm text-gray-900">
                                                {{ __('messages.auth.remember_me') }}
                                            </label>
                                        </div>

                                        <div class="text-sm">
                                            <a href="#" class="font-medium text-primary hover:text-primary-600">
                                                {{ __('messages.auth.forgot_password') }}
                                            </a>
                                        </div>
                                    </div>

                                    <!-- Submit button -->
                                    <div>
                                        <button type="submit" 
                                                wire:loading.attr="disabled"
                                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                                            <span wire:loading.remove>{{ __('messages.auth.login') }}</span>
                                            <span wire:loading>{{ __('messages.common.loading') }}...</span>
                                        </button>
                                    </div>

                                    <!-- Switch to register -->
                                    <div class="text-center">
                                        <p class="text-sm text-gray-600">
                                            {{ __('messages.auth.no_account') }}
                                            <button type="button" wire:click="switchToRegister" class="font-medium text-primary hover:text-primary-600">
                                                {{ __('messages.auth.register_now') }}
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    @endif
</div>
