<!-- Main Sidebar Container -->
<aside class="main-sidebar sidebar-dark-primary elevation-4">
    <!-- Brand Logo -->
    <a href="/admin/dashboard" class="brand-link">
        {{-- <img src="{{ asset('assets/img/logo.png') }}" alt="BARKA Logo" class="brand-image img-square elevation-3"
            style="opacity: .8"> --}}
        <span class="brand-text font-weight-light">BARKA Admin</span>
    </a>

    <!-- Sidebar -->
    <div class="sidebar">
        <!-- Sidebar user panel -->
        <div class="user-panel mt-3 pb-3 mb-3 d-flex">
            <div class="image">
                <img src="{{ asset('assets/img/logo.png') }}" class="img-circle elevation-2" alt="User Image">
            </div>
            <div class="info">
                <a href="#" class="d-block">{{ (Auth::user()->nom ?? '') . ' ' . (Auth::user()->prenom ?? '') ?: Auth::user()->name ?? 'Administrateur' }}</a>
                <small> Admin</small>
            </div>
        </div>

        <!-- Sidebar Menu -->
        <nav class="mt-2">
            <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu"
                data-accordion="false">
                <!-- Dashboard -->
                <li class="nav-item {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                    <a href="/admin"
                        class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-tachometer-alt"></i>
                        <p>Tableau de bord</p>
                    </a>
                </li>

                <!-- Properties -->
                <li class="nav-item {{ request()->is('admin/properties*') ? 'active' : '' }}">
                    <a href="/admin/properties"
                        class="nav-link {{ request()->is('admin/properties*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-building"></i>
                        <p>{{ __('messages.admin.properties') }}</p>
                        <span class="badge badge-info right">{{ \App\Models\Bien::count() }}</span>
                    </a>
                </li>

                <!-- Bookings -->
                <li class="nav-item {{ request()->is('admin/bookings*') ? 'active' : '' }}">
                    <a href="/admin/bookings" class="nav-link {{ request()->is('admin/bookings*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-calendar-check"></i>
                        <p>{{ __('messages.admin.bookings') }}</p>
                        <span class="badge badge-success right">{{ \App\Models\Reservation::count() }}</span>
                    </a>
                </li>

                <!-- Promoters -->
                <li class="nav-item {{ request()->is('admin/promoters*') ? 'active' : '' }}">
                    <a href="/admin/promoters"
                        class="nav-link {{ request()->is('admin/promoters*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-user-tie"></i>
                        <p>{{ __('messages.admin.promoters') }}</p>
                        @php
                            $pendingPromoters = \App\Models\Promoteur::where('statut', 'EN_ATTENTE')->count();
                        @endphp
                        @if ($pendingPromoters > 0)
                            <span class="badge badge-warning right">{{ $pendingPromoters }}</span>
                        @endif
                    </a>
                </li>

                <!-- Contacts - Désactivé (modèle supprimé) -->
                {{-- <li class="nav-item {{ request()->is('admin/contacts*') ? 'active' : '' }}">
                    <a href="/admin/contacts" class="nav-link {{ request()->is('admin/contacts*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-envelope"></i>
                        <p>{{ __('messages.admin.contacts') }}</p>
                    </a>
                </li> --}}

                <!-- Payments -->
                <li class="nav-item {{ request()->is('admin/payments*') ? 'active' : '' }}">
                    <a href="/admin/payments" class="nav-link {{ request()->is('admin/payments*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-dollar-sign"></i>
                        <p>{{ __('messages.admin.payments') }}</p>
                        @php
                            $pendingPayments = \App\Models\Paiement::where('statut', 'EN_ATTENTE')->count();
                        @endphp
                        @if ($pendingPayments > 0)
                            <span class="badge badge-warning right">{{ $pendingPayments }}</span>
                        @endif
                    </a>
                </li>

                <!-- Validations -->
                <li class="nav-item {{ request()->is('admin/validations*') ? 'active' : '' }}">
                    <a href="/admin/validations" class="nav-link {{ request()->is('admin/validations*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-clipboard-check"></i>
                        <p>Validations</p>
                        @php
                            $pendingValidations = \App\Models\DemandeValidation::where('statut', 'EN_ATTENTE')->count();
                        @endphp
                        @if ($pendingValidations > 0)
                            <span class="badge badge-warning right">{{ $pendingValidations }}</span>
                        @endif
                    </a>
                </li>

                <!-- Commissions -->
                <li class="nav-item {{ request()->is('admin/commissions*') ? 'active' : '' }}">
                    <a href="/admin/commissions" class="nav-link {{ request()->is('admin/commissions*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-money-bill-wave"></i>
                        <p>Commissions</p>
                        @php
                            $pendingCommissions = \App\Models\Commission::where('est_transfere', false)->count();
                            $pendingCommissionsAmount = \App\Models\Commission::where('est_transfere', false)->sum('montant_commission');
                        @endphp
                        @if ($pendingCommissions > 0)
                            <span class="badge badge-warning right">{{ $pendingCommissions }}</span>
                        @endif
                    </a>
                </li>

                <!-- Clients -->
                <li class="nav-item {{ request()->is('admin/clients*') ? 'active' : '' }}">
                    <a href="/admin/clients" class="nav-link {{ request()->is('admin/clients*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-users"></i>
                        <p>Clients</p>
                        <span class="badge badge-info right">{{ \App\Models\Client::count() }}</span>
                    </a>
                </li>

                <!-- Notifications -->
                <li class="nav-item {{ request()->is('admin/notifications*') ? 'active' : '' }}">
                    <a href="/admin/notifications" class="nav-link {{ request()->is('admin/notifications*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-bell"></i>
                        <p>Notifications</p>
                        @php
                            $unreadNotifications = \App\Models\Notification::where('est_lue', false)->count();
                        @endphp
                        @if ($unreadNotifications > 0)
                            <span class="badge badge-warning right">{{ $unreadNotifications }}</span>
                        @endif
                    </a>
                </li>

                <!-- Paramètres -->
                <li class="nav-item {{ request()->is('admin/settings*') ? 'active' : '' }}">
                    <a href="/admin/settings" class="nav-link {{ request()->is('admin/settings*') ? 'active' : '' }}">
                        <i class="nav-icon fas fa-cogs"></i>
                        <p>Paramètres</p>
                    </a>
                </li>

            
                <!-- Déconnexion -->
                <li class="nav-item">
                    <a href="#" class="nav-link"
                        onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                        <i class="nav-icon fas fa-sign-out-alt"></i>
                        <p>Déconnexion</p>
                    </a>
                    <form id="logout-form" action="/admin/logout" method="POST" style="display: none;">
                        @csrf
                    </form>
                </li>
            </ul>
        </nav>
        <!-- /.sidebar-menu -->
    </div>
    <!-- /.sidebar -->
</aside>
