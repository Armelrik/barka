<div>
    @livewire('components.header')

    <div class="container mx-auto px-4 py-24">
        <h1 class="text-3xl font-bold mb-8">Tableau de bord</h1>

        {{-- Statistics Cards --}}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {{-- Active Bookings --}}
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Réservations actives</p>
                        <p class="text-3xl font-bold text-primary">{{ $stats['active_bookings'] }}</p>
                    </div>
                    <svg class="w-12 h-12 text-primary opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                </div>
            </div>

            {{-- Total Bookings --}}
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total réservations</p>
                        <p class="text-3xl font-bold text-blue-500">{{ $stats['total_bookings'] }}</p>
                    </div>
                    <svg class="w-12 h-12 text-blue-500 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                </div>
            </div>

            {{-- Pending Payments --}}
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Paiements en attente</p>
                        <p class="text-3xl font-bold text-orange-500">{{ $stats['pending_payments'] }}</p>
                    </div>
                    <svg class="w-12 h-12 text-orange-500 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>

            {{-- Pending Reservations --}}
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Réservations en attente</p>
                        <p class="text-3xl font-bold text-orange-500">{{ $stats['pending_reservations'] }}</p>
                    </div>
                    <svg class="w-12 h-12 text-orange-500 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3l3 3v4M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v13a2 2 0 002 2z"/>
                    </svg>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {{-- Main Content --}}
            <div class="lg:col-span-2 space-y-8">
                {{-- Recent Bookings --}}
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Mes réservations récentes</h2>
                        <a href="{{ route('client.bookings') }}" class="text-primary hover:text-primary-600">
                            Voir tout →
                        </a>
                    </div>

                    @if($recentBookings->count() > 0)
                        <div class="space-y-4">
                            @foreach($recentBookings as $booking)
                                <div class="border rounded-lg p-4 hover:shadow-md transition-all">
                                    <div class="flex items-start gap-4">
                                        @if($booking->bien->medias && $booking->bien->medias->where('type_media', 'IMAGE')->count() > 0)
                                            @php
                                                $image = $booking->bien->medias->where('type_media', 'IMAGE')->first();
                                            @endphp
                                            <img src="{{ $image->public_url }}" 
                                                 alt="{{ $booking->bien->titre }}" 
                                                 class="w-20 h-20 object-cover rounded-lg">
                                        @endif
                                        <div class="flex-1">
                                            <h3 class="font-semibold">{{ $booking->bien->titre }}</h3>
                                            <p class="text-sm text-gray-600">{{ $booking->bien->ville }}@if($booking->bien->quartier), {{ $booking->bien->quartier }}@endif</p>
                                            <div class="flex gap-4 mt-2 text-sm">
                                                <span class="px-3 py-1 rounded-full text-xs font-semibold 
                                                    {{ $booking->statut == 'CONFIRME' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800' }}">
                                                    @switch($booking->statut)
                                                        @case('EN_ATTENTE')
                                                            En attente
                                                            @break
                                                        @case('CONFIRME')
                                                            Confirmée
                                                            @break
                                                        @case('TERMINE')
                                                            Terminée
                                                            @break
                                                        @case('ANNULE')
                                                            Annulée
                                                            @break
                                                    @endswitch
                                                </span>
                                                <span class="text-gray-600">
                                                    {{ $booking->date_debut->format('d/m/Y') }} - {{ $booking->date_fin->format('d/m/Y') }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-bold text-primary">{{ number_format($booking->montant_total, 0, ',', ' ') }} FCFA</p>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <p class="text-gray-500 text-center py-8">Vous n'avez pas encore de réservation.</p>
                    @endif
                </div>

                {{-- Pending Payments --}}
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Paiements en attente</h2>
                        <a href="{{ route('client.bookings') }}" class="text-primary hover:text-primary-600">
                            Voir tout →
                        </a>
                    </div>
                    
                    @if($pendingPayments->count() > 0)
                        <div class="space-y-3">
                            @foreach($pendingPayments as $payment)
                                <div class="border rounded-lg p-3">
                                    <p class="font-semibold text-sm">{{ number_format($payment->montant, 0, ',', ' ') }} FCFA</p>
                                    <p class="text-xs text-gray-600">{{ $payment->reservation->bien->ville }}@if($payment->reservation->bien->quartier), {{ $payment->reservation->bien->quartier }}@endif</p>
                                    <a href="{{ route('payment.show', $payment->reservation_id) }}" class="text-xs text-primary hover:underline">
                                        Payer maintenant →
                                    </a>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <p class="text-gray-500 text-sm">Aucun paiement en attente</p>
                    @endif
                </div>
            </div>

            {{-- Sidebar --}}
            <div class="lg:col-span-1 space-y-6">
                {{-- Quick Actions --}}
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-bold mb-4">Actions rapides</h3>
                    <div class="space-y-2">
                        <a href="{{ route('properties.index') }}" class="block w-full px-4 py-2 bg-primary text-white text-center rounded-lg hover:bg-primary-600 transition-colors">
                            Parcourir les propriétés
                        </a>
                        <a href="{{ route('client.bookings') }}" class="block w-full px-4 py-2 border-2 border-primary text-primary text-center rounded-lg hover:bg-primary hover:text-white transition-colors">
                            Voir mes réservations
                        </a>
                        <a href="" class="block w-full px-4 py-2 border-2 border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-100 transition-colors">
                            Mon profil
                        </a>
                    </div>
                </div>

                {{-- Help Section --}}
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h3 class="text-lg font-bold mb-3">Besoin d'aide ?</h3>
                    <div class="space-y-2 text-sm">
                        <p class="text-gray-600">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            Pour toute question sur vos réservations
                        </p>
                        <p class="text-gray-600">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h14M7 5v14a3 3 0 01-3 3H6a3 3 0 00-3-3V6a3 3 0 013-3h6a3 3 0 013 3z"/>
                            </svg>
                            Pour contacter le support technique
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @livewire('components.footer')
</div>
