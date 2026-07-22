<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Country;
use App\Models\FoodCategory;
use App\Models\PointPackage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $uganda = Country::firstOrCreate(
            ['code' => 'UG'],
            ['name' => 'Uganda', 'currency_code' => 'UGX', 'is_active' => true]
        );

        User::firstOrCreate(
            ['email' => 'superadmin@kugawana.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin.ug@kugawana.com'],
            [
                'name' => 'Uganda Admin',
                'password' => Hash::make('password'),
                'role' => UserRole::CountryAdmin,
                'country_id' => $uganda->id,
                'is_active' => true,
            ]
        );

        $categories = [
            'Fresh',
            'Frozen',
            'Dry foods',
            'Cooked foods',
            'Beverages',
            'Bakery',
            'Baby food',
            'Vegetables',
            'Fruits',
        ];

        foreach ($categories as $category) {
            FoodCategory::firstOrCreate(['name' => $category]);
        }

        $packages = [
            ['name' => 'Starter', 'points' => 100, 'price' => 1000],
            ['name' => 'Basic', 'points' => 250, 'price' => 2300],
            ['name' => 'Standard', 'points' => 500, 'price' => 4500],
            ['name' => 'Plus', 'points' => 1000, 'price' => 8500],
        ];

        foreach ($packages as $package) {
            PointPackage::firstOrCreate(
                ['name' => $package['name']],
                [
                    'points' => $package['points'],
                    'price' => $package['price'],
                    'currency' => 'UGX',
                    'country_id' => $uganda->id,
                ]
            );
        }
    }
}
