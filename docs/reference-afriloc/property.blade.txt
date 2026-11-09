<div>
    @livewire('components.header')

    <div class="container mx-auto px-4 py-24">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {{-- Main Content --}}
            <div class="lg:col-span-2">
                {{-- Image Gallery --}}
                @php
                    $images = $property->medias->where('type_media', 'IMAGE');
                @endphp
                @if($images->count() > 0)
                    <div class="mb-8">
                        <img src="{{ $images->first()->public_url }}" alt="{{ $property->titre }}" 
                             class="w-full h-96 object-cover rounded-xl shadow-lg">
                    </div>
                @endif

                <h1 class="text-4xl font-bold mb-4">
                    {{ $property->titre }}
                </h1>

                <div class="flex items-center space-x-4 mb-6 text-gray-600">
                    <span class="flex items-center">
                        <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        {{ $property->ville }}@if($property->quartier), {{ $property->quartier }}@endif
                    </span>
                    <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold capitalize">
                        {{ $property->type_bien }}
                    </span>
                </div>

                <div class="prose max-w-none mb-8">
                    <h2>{{ __('messages.properties.description') }}</h2>
                    <p>{{ $property->description }}</p>
                </div>

                {{-- Features --}}
                @if($property->nombre_chambres || $property->nombre_salles_bain || $property->superficie)
                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-xl font-bold mb-4">{{ __('messages.properties.features') }}</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            @if($property->nombre_chambres)
                                <div class="flex items-center">
                                    <svg class="h-6 w-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                    <span>{{ $property->nombre_chambres }} {{ __('messages.properties.bedrooms') }}</span>
                                </div>
                            @endif
                            @if($property->nombre_salles_bain)
                                <div class="flex items-center">
                                    <svg class="h-6 w-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <span>{{ $property->nombre_salles_bain }} {{ __('messages.properties.bathrooms') }}</span>
                                </div>
                            @endif
                            @if($property->superficie)
                                <div class="flex items-center">
                                    <svg class="h-6 w-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                                    </svg>
                                    <span>{{ number_format($property->superficie, 0) }} m²</span>
                                </div>
                            @endif
                        </div>
                    </div>
                @endif
            </div>

            {{-- Sidebar --}}
            <div class="lg:col-span-1">
                <div class="bg-white p-6 rounded-lg shadow-lg sticky top-24">
                    <div class="text-3xl font-bold text-primary mb-2">
                        {{ number_format($property->prix_location, 0, ',', ' ') }} FCFA
                    </div>
                    @if($property->frequence_location)
                        <p class="text-gray-600 mb-6">{{ __('messages.properties.per_' . $property->frequence_location) }}</p>
                    @else
                        <p class="text-gray-600 mb-6">{{ __('messages.properties.per_month') }}</p>
                    @endif

                    @if($property->disponibilite === 'disponible')
                        @auth
                            @if($existingReservation)
                                <a href="{{ route('client.bookings') }}#reservation-{{ $existingReservation->id }}" 
                                   class="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-3 rounded-lg hover:shadow-xl transition-all hover:scale-105 font-semibold mb-3">
                                    <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                    Voir ma réservation
                                </a>
                            @elseif(auth()->user()->isClient() || auth()->user()->isAdmin())
                                <a href="{{ route('booking.create', $property->id) }}" 
                                   class="block w-full bg-gradient-to-r from-primary to-accent text-white text-center py-3 rounded-lg hover:shadow-xl transition-all hover:scale-105 font-semibold mb-3">
                                    {{ __('messages.properties.book_now') }}
                                </a>
                            @endif
                        @else
                            <button onclick="Livewire.dispatch('openLoginModal')" 
                                    class="block w-full bg-gradient-to-r from-primary to-accent text-white text-center py-3 rounded-lg hover:shadow-xl transition-all hover:scale-105 font-semibold mb-3">
                                {{ __('messages.booking.login_to_book') }}
                            </button>
                        @endauth
                    @endif

                    @if($property->promoteur && $property->promoteur->user && $property->promoteur->user->telephone)
                        <a href="tel:{{ $property->promoteur->user->telephone }}" 
                           class="block w-full bg-white border-2 border-primary text-primary text-center py-3 rounded-lg hover:bg-primary hover:text-white transition-colors mb-4">
                            <i class="fas fa-phone mr-2"></i>
                            {{ __('messages.properties.contact') }}: {{ $property->promoteur->user->telephone }}
                        </a>
                    @else
                        <a href="/contact?property={{ $property->id }}" 
                           class="block w-full bg-white border-2 border-primary text-primary text-center py-3 rounded-lg hover:bg-primary hover:text-white transition-colors mb-4">
                            {{ __('messages.properties.contact') }}
                        </a>
                    @endif

                    <div class="border-t pt-4">
                        <h4 class="font-semibold mb-2">{{ __('messages.properties.status_label') }}</h4>
                        <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold 
                                     {{ $property->disponibilite === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }}">
                            {{ __('messages.properties.status.' . $property->disponibilite) }}
                        </span>
                    </div>

                    @if($property->adresse)
                        <div class="border-t pt-4 mt-4">
                            <h4 class="font-semibold mb-2">{{ __('messages.properties.address') }}</h4>
                            <p class="text-gray-600">{{ $property->adresse }}</p>
                        </div>
                    @endif

                    {{-- Rental Details --}}
                    <div class="border-t pt-4 mt-4">
                        <h4 class="font-semibold mb-3">{{ __('messages.booking.rental_details') }}</h4>
                        <div class="space-y-2 text-sm">
                            @if($property->prix_location)
                                <div class="flex justify-between">
                                    <span class="text-gray-600">{{ __('messages.booking.monthly_rent') }}:</span>
                                    <span class="font-semibold">{{ number_format($property->prix_location, 0, ',', ' ') }} FCFA</span>
                                </div>
                            @endif
                            @if($property->depot_garantie)
                                <div class="flex justify-between">
                                    <span class="text-gray-600">{{ __('messages.booking.deposit') }}:</span>
                                    <span class="font-semibold">{{ number_format($property->depot_garantie, 0, ',', ' ') }} FCFA</span>
                                </div>
                            @endif
                            @if($property->avance)
                                <div class="flex justify-between">
                                    <span class="text-gray-600">{{ __('messages.booking.advance') }}:</span>
                                    <span class="font-semibold">{{ number_format($property->avance, 0, ',', ' ') }} FCFA</span>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @livewire('components.footer')
</div>
