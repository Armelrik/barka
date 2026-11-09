<div>
    @livewire('components.header')

    {{-- Hero Section --}}
    <section class="relative min-h-screen sm:h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('{{ asset('images/ouaga-hero.jpg') }}')">
            <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40 sm:from-black/70 sm:via-black/50 sm:to-transparent"></div>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 pb-44 sm:pb-48 md:pb-52">
            <div class="max-w-4xl">
                <!-- Main Heading -->
                <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 animate-fade-in leading-tight">
                    {{ __('messages.hero.title') }}
                </h1>
                
                <!-- Subtitle -->
                <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 animate-fade-in max-w-2xl">
                    {{ __('messages.hero.subtitle') }}
                </p>
                
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in mb-8 sm:mb-0">
                    <a href="/properties" class="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all hover:scale-105 font-semibold text-sm sm:text-base shadow-lg">
                        {{ __('messages.hero.cta') }}
                        <svg class="ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                    <a href="/become-promoter" class="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-lg hover:bg-white/20 transition-all font-semibold text-sm sm:text-base">
                        {{ __('messages.nav.become_promoter') }}
                    </a>
                </div>
            </div>
        </div>

        <!-- Floating Stats -->
        <div class="absolute bottom-0 left-0 right-0 z-10 pb-4 sm:pb-6 md:pb-8">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-6xl mx-auto">
                    <!-- Stat 1 -->
                    <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                        <svg class="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        <div class="text-xl sm:text-2xl md:text-3xl font-bold">100+</div>
                        <div class="text-xs sm:text-sm opacity-90 mt-1">{{ __('messages.stats.houses') }}</div>
                    </div>

                    <!-- Stat 2 -->
                    <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                        <svg class="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <div class="text-xl sm:text-2xl md:text-3xl font-bold">50+</div>
                        <div class="text-xs sm:text-sm opacity-90 mt-1">{{ __('messages.stats.apartments') }}</div>
                    </div>

                    <!-- Stat 3 -->
                    <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                        <svg class="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        <div class="text-xl sm:text-2xl md:text-3xl font-bold">50+</div>
                        <div class="text-xs sm:text-sm opacity-90 mt-1">{{ __('messages.stats.promoters') }}</div>
                    </div>

                    <!-- Stat 4 -->
                    <div class="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-center text-white hover:bg-white/20 transition-all hover:scale-105">
                        <svg class="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mx-auto mb-1 sm:mb-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                        </svg>
                        <div class="text-xl sm:text-2xl md:text-3xl font-bold">200+</div>
                        <div class="text-xs sm:text-sm opacity-90 mt-1">{{ __('messages.stats.clients') }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scroll Indicator (Hidden on mobile) -->
        <div class="hidden md:block absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
            <svg class="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
        </div>
    </section>

    {{-- How It Works Section --}}
    <section class="py-12 sm:py-16 md:py-20 bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-10 sm:mb-12 md:mb-16">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                    {{ __('messages.how_it_works.title') }}
                </h2>
                <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                    {{ __('messages.how_it_works.subtitle') }}
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {{-- Step 1 --}}
                <div class="text-center group">
                    <div class="relative mb-4 sm:mb-6">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                        <div class="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">1</div>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{{ __('messages.how_it_works.step1.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600 px-2">{{ __('messages.how_it_works.step1.desc') }}</p>
                </div>

                {{-- Step 2 --}}
                <div class="text-center group">
                    <div class="relative mb-4 sm:mb-6">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div class="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">2</div>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{{ __('messages.how_it_works.step2.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600 px-2">{{ __('messages.how_it_works.step2.desc') }}</p>
                </div>

                {{-- Step 3 --}}
                <div class="text-center group sm:col-span-2 lg:col-span-1">
                    <div class="relative mb-4 sm:mb-6">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                            </svg>
                        </div>
                        <div class="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">3</div>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{{ __('messages.how_it_works.step3.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600 px-2">{{ __('messages.how_it_works.step3.desc') }}</p>
                </div>
            </div>
        </div>
    </section>

    {{-- Featured Properties --}}
    <section class="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-8 sm:mb-10 md:mb-12">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                    {{ __('messages.properties.title') }}
                </h2>
                <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                    {{ __('messages.hero.subtitle') }}
                </p>
            </div>

            @if($featuredProperties->count() > 0)
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    @foreach($featuredProperties as $property)
                        @livewire('components.property-card', ['property' => $property], key($property->id))
                    @endforeach
                </div>
            @else
                <div class="text-center py-12 sm:py-16 md:py-20">
                    <div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                        <svg class="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </div>
                    <p class="text-lg sm:text-xl text-gray-500">{{ __('messages.common.loading') }}</p>
                </div>
            @endif

            <div class="text-center mt-8 sm:mt-10 md:mt-12">
                <a href="/properties" class="inline-flex items-center px-6 sm:px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all hover:scale-105 font-semibold text-sm sm:text-base shadow-lg">
                    {{ __('messages.properties.view_all') }}
                    <svg class="ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    </section>

    {{-- Why Choose Us Section --}}
    <section class="py-12 sm:py-16 md:py-20 bg-white">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-10 sm:mb-12 md:mb-16">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
                    {{ __('messages.benefits.title') }}
                </h2>
                <p class="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                    {{ __('messages.benefits.subtitle') }}
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {{-- Benefit 1 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.verified.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.verified.desc') }}</p>
                </div>

                {{-- Benefit 2 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.support.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.support.desc') }}</p>
                </div>

                {{-- Benefit 3 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.transparent.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.transparent.desc') }}</p>
                </div>

                {{-- Benefit 4 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.secure.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.secure.desc') }}</p>
                </div>

                {{-- Benefit 5 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.fast.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.fast.desc') }}</p>
                </div>

                {{-- Benefit 6 --}}
                <div class="p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all group">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg sm:text-xl font-bold mb-2">{{ __('messages.benefits.quality.title') }}</h3>
                    <p class="text-sm sm:text-base text-gray-600">{{ __('messages.benefits.quality.desc') }}</p>
                </div>
            </div>
        </div>
    </section>

    {{-- Become Promoter CTA --}}
    <section class="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-primary via-primary-600 to-accent text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
            <div class="absolute transform rotate-45 -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full"></div>
            <div class="absolute transform -rotate-45 -bottom-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full"></div>
        </div>
        
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                    {{ __('messages.become_promoter.title') }}
                </h2>
                <p class="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
                    {{ __('messages.become_promoter.subtitle') }}
                </p>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div class="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span class="text-sm sm:text-base">{{ __('messages.become_promoter.benefit1') }}</span>
                    </div>
                    <div class="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span class="text-sm sm:text-base">{{ __('messages.become_promoter.benefit2') }}</span>
                    </div>
                    <div class="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span class="text-sm sm:text-base">{{ __('messages.become_promoter.benefit3') }}</span>
                    </div>
                    <div class="flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-lg p-3 sm:p-4">
                        <svg class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span class="text-sm sm:text-base">{{ __('messages.become_promoter.benefit4') }}</span>
                    </div>
                </div>
                
                <a href="/become-promoter" class="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-all hover:scale-105 text-base sm:text-lg font-semibold shadow-lg">
                    {{ __('messages.become_promoter.cta') }}
                    <svg class="ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    </section>

    {{-- Contact CTA Section --}}
    <section class="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-foreground">
                {{ __('messages.cta.title') }}
            </h2>
            <p class="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-600 max-w-2xl mx-auto px-4">
                {{ __('messages.cta.subtitle') }}
            </p>
            <a href="/contact" class="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-xl transition-all hover:scale-105 text-base sm:text-lg font-semibold">
                {{ __('messages.nav.contact') }}
                <svg class="ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
            </a>
        </div>
    </section>

    @livewire('components.footer')
</div>