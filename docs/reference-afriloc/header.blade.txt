<div>
    {{-- Auth Modals --}}
    @livewire('auth.login-modal')
    @livewire('auth.register-modal')

<header class="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
    <nav class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
            {{-- Logo --}}
            <a href="/" class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                </div>
                <span class="text-2xl font-bold text-primary">BARKA</span>
            </a>

            {{-- Desktop Navigation --}}
            <div class="hidden lg:flex items-center space-x-8">
                <a href="/" class="text-gray-700 hover:text-primary transition-colors font-medium {{ request()->is('/') ? 'text-primary' : '' }}">
                    {{ __('messages.nav.home') }}
                </a>
                <a href="/properties" class="text-gray-700 hover:text-primary transition-colors font-medium {{ request()->is('properties*') ? 'text-primary' : '' }}">
                    {{ __('messages.nav.properties') }}
                </a>
                <a href="/contact" class="text-gray-700 hover:text-primary transition-colors font-medium {{ request()->is('contact') ? 'text-primary' : '' }}">
                    {{ __('messages.nav.contact') }}
                </a>
                
                @auth
                    @if(auth()->user()->hasRole('admin'))
                        <a href="/admin" class="text-gray-700 hover:text-primary transition-colors font-medium">
                            {{ __('messages.nav.admin') }}
                        </a>
                    @elseif(auth()->user()->hasRole('promoter'))
                        <a href="/promoter/dashboard" class="text-gray-700 hover:text-primary transition-colors font-medium">
                            {{ __('messages.nav.dashboard') }}
                        </a>
                    @else
                        <a href="/my/bookings" class="text-gray-700 hover:text-primary transition-colors font-medium">
                            {{ __('messages.nav.my_bookings') }}
                        </a>
                    @endif
                @endauth
            </div>

            {{-- Right Side Actions --}}
            <div class="hidden lg:flex items-center space-x-4">
                {{-- Language Switcher --}}
                <div class="flex items-center bg-gray-100 rounded-lg p-1">
                    <button 
                        wire:click="switchLanguage('fr')" 
                        class="px-3 py-1.5 rounded-md transition-all {{ app()->getLocale() == 'fr' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900' }}">
                        FR
                    </button>
                    <button 
                        wire:click="switchLanguage('en')" 
                        class="px-3 py-1.5 rounded-md transition-all {{ app()->getLocale() == 'en' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900' }}">
                        EN
                    </button>
                </div>

                @auth
                    <div class="relative" x-data="{ open: false }">
                        <button @click="open = !open" class="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors">
                            <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                                {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}
                            </div>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        <div x-show="open" 
                             @click.away="open = false"
                             x-transition
                             class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                            <div class="px-4 py-2 border-b border-gray-200">
                                <p class="text-sm font-semibold text-gray-900">{{ auth()->user()->name }}</p>
                                <p class="text-xs text-gray-500">{{ auth()->user()->email }}</p>
                            </div>
                            @if(auth()->user()->hasRole('admin'))
                            <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                {{ __('messages.nav.my_account') }}
                            </a>
                            @endif
                            @if(auth()->user()->hasRole('promoter'))
                            <a href="/promoter/dashboard" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                {{ __('messages.nav.dashboard') }}
                            </a>
                            @endif
                            @if(auth()->user()->hasRole('client'))
                            <a href="/my/dashboard" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                {{ __('messages.nav.my_account') }}
                            </a>
                            @endif
                            <form action="/logout" method="POST">
                                @csrf
                                <button type="submit" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                    {{ __('messages.nav.logout') }}
                                </button>
                            </form>
                        </div>
                    </div>
                @else
                    <button onclick="Livewire.dispatch('openLoginModal')" class="text-gray-700 hover:text-primary transition-colors font-medium">
                        {{ __('messages.nav.login') }}
                    </button>
                    <button onclick="Livewire.dispatch('openRegisterModal')" class="px-4 py-2 bg-primary text-white rounded-lg hover:shadow-lg transition-all font-medium">
                        {{ __('messages.nav.register') }}
                    </button>
                    <a href="/become-promoter" class="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all font-medium">
                        {{ __('messages.nav.become_promoter') }}
                    </a>
                @endauth
            </div>

            {{-- Mobile menu button --}}
            <button wire:click="toggleMobileMenu" class="lg:hidden p-2 text-gray-700 hover:text-primary">
                @if($mobileMenuOpen)
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                @else
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                @endif
            </button>
        </div>

        {{-- Mobile Menu --}}
        @if($mobileMenuOpen)
            <div class="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
                <div class="flex flex-col space-y-3">
                    <a href="/" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2">
                        {{ __('messages.nav.home') }}
                    </a>
                    <a href="/properties" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2">
                        {{ __('messages.nav.properties') }}
                    </a>
                    <a href="/contact" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2">
                        {{ __('messages.nav.contact') }}
                    </a>
                    
                    @auth
                        @if(auth()->user()->hasRole('admin'))
                            <a href="/admin" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2">
                                {{ __('messages.nav.admin') }}
                            </a>
                        @elseif(auth()->user()->hasRole('promoter'))
                            <a href="/promoter/dashboard" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2">
                                {{ __('messages.nav.dashboard') }}
                            </a>
                        @endif
                        
                        <div class="border-t border-gray-200 pt-3 mt-3">
                            <p class="text-sm font-semibold text-gray-900 px-2 mb-2">{{ auth()->user()->name }}</p>
                            <form action="/logout" method="POST">
                                @csrf
                                <button type="submit" class="w-full text-left text-red-600 font-medium px-2 py-2">
                                    {{ __('messages.nav.logout') }}
                                </button>
                            </form>
                        </div>
                    @else
                        <button onclick="Livewire.dispatch('openLoginModal')" class="text-gray-700 hover:text-primary transition-colors font-medium px-2 py-2 text-left w-full">
                            {{ __('messages.nav.login') }}
                        </button>
                        <button onclick="Livewire.dispatch('openRegisterModal')" class="px-4 py-2 bg-primary text-white rounded-lg text-center font-medium w-full">
                            {{ __('messages.nav.register') }}
                        </button>
                        <a href="/become-promoter" class="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg text-center font-medium block">
                            {{ __('messages.nav.become_promoter') }}
                        </a>
                    @endauth
                    
                    {{-- Mobile Language Switcher --}}
                    <div class="border-t border-gray-200 pt-3 mt-3">
                        <div class="flex items-center justify-center space-x-2">
                            <button 
                                wire:click="switchLanguage('fr')" 
                                class="flex-1 px-4 py-2 rounded-lg transition-all {{ app()->getLocale() == 'fr' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700' }}">
                                Français
                            </button>
                            <button 
                                wire:click="switchLanguage('en')" 
                                class="flex-1 px-4 py-2 rounded-lg transition-all {{ app()->getLocale() == 'en' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700' }}">
                                English
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        @endif
    </nav>
</header>
</div>
