<?php

namespace Database\Seeders;

use App\Enums\FoodStatus;
use App\Enums\OrderStatus;
use App\Enums\PostStatus;
use App\Enums\PostType;
use App\Enums\UserRole;
use App\Models\Article;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\FoodCategory;
use App\Models\FoodDonation;
use App\Models\Order;
use App\Models\Rating;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Realistic demo content so the mobile app has something to render.
 *
 * Idempotent: matches existing rows on a natural key and updates them, so it is
 * safe to re-run. Images ship as fixtures under database/seeders/media and are
 * copied into the public disk, so this works offline and survives migrate:fresh.
 */
class DemoContentSeeder extends Seeder
{
    private const MEDIA = __DIR__ . '/media';

    public function run(): void
    {
        $this->publishMedia();

        $donors = $this->users();
        $categories = FoodCategory::pluck('id', 'name');

        $this->foodDonations($donors, $categories);
        $this->articles();
        $this->communityPosts($donors);
        $this->ordersAndRatings($donors);

        $this->command?->info('Demo content seeded.');
    }

    /** Copy fixture images onto the public disk, skipping ones already there. */
    private function publishMedia(): void
    {
        foreach (['food', 'avatars', 'articles'] as $folder) {
            $source = self::MEDIA . DIRECTORY_SEPARATOR . $folder;

            if (! File::isDirectory($source)) {
                continue;
            }

            foreach (File::files($source) as $file) {
                $target = "{$folder}/{$file->getFilename()}";

                if (! Storage::disk('public')->exists($target)) {
                    Storage::disk('public')->put($target, File::get($file->getPathname()));
                }
            }
        }
    }

    /** @return array<string, User> */
    private function users(): array
    {
        $people = [
            ['email' => 'grace@example.com', 'name' => 'Grace Achieng', 'role' => UserRole::Donor,
             'district' => 'Kiwatule', 'photo' => 'avatars/user1.jpg', 'phone' => '0700123456',
             'bio' => 'I grow vegetables in Kiwatule and share whatever my family cannot finish.'],
            ['email' => 'amina@example.com', 'name' => 'Amina Namatovu', 'role' => UserRole::Receiver,
             'district' => 'Nakawa', 'photo' => 'avatars/user2.jpg', 'phone' => '0700223344',
             'bio' => 'Mother of three. Grateful for this community.'],
            ['email' => 'samuel@example.com', 'name' => 'Samuel Kato', 'role' => UserRole::Donor,
             'district' => 'Bweyogerere', 'photo' => 'avatars/user3.jpg', 'phone' => '0700334455',
             'bio' => 'I run a small shop and share surplus stock before it expires.'],
            ['email' => 'lydia@example.com', 'name' => 'Lydia Nakato', 'role' => UserRole::Donor,
             'district' => 'Ntinda', 'photo' => 'avatars/user4.jpg', 'phone' => '0700445566',
             'bio' => 'Baker. Fresh bread most mornings.'],
            ['email' => 'testreceiver@example.com', 'name' => 'Test Receiver', 'role' => UserRole::Receiver,
             'district' => 'Kireka', 'photo' => 'avatars/user5.jpg', 'phone' => '0700556677',
             'bio' => 'Demo account for testing the receiver flows.'],
        ];

        $users = [];

        foreach ($people as $person) {
            $user = User::updateOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'role' => $person['role'],
                    'district' => $person['district'],
                    'profile_photo' => $person['photo'],
                    'phone' => $person['phone'],
                    'bio' => $person['bio'],
                    'country_id' => 1,
                    'is_active' => true,
                    'password' => bcrypt('password'),
                    'wallet_balance' => 50,
                    'responsibility_score' => 100,
                ],
            );

            $users[$person['email']] = $user;
        }

        return $users;
    }

    private function foodDonations(array $users, $categories): void
    {
        $grace = $users['grace@example.com'];
        $samuel = $users['samuel@example.com'];
        $lydia = $users['lydia@example.com'];
        $amina = $users['amina@example.com'];

        $units = Unit::pluck('id', 'symbol');

        // [title, amount, unitSymbol, category, donor, image, district, hoursAgo, hoursUntilExpiry, status]
        $rows = [
            ['Fresh Tomatoes', 2, 'Kg', 'Vegetables', $grace, 'tomatoes.jpg', 'Kiwatule, Kampala', 2, 30, FoodStatus::Published],
            ['Bananas', 3, 'bunches', 'Fruits', $grace, 'bananas.jpg', 'Kiwatule, Kampala', 5, 48, FoodStatus::Published],
            ['Mixed Vegetables', 4, 'Kg', 'Vegetables', $samuel, 'vegetables.jpg', 'Bweyogerere, Kampala', 8, 24, FoodStatus::Published],
            ['Cooking Oil', 1, 'L', 'Dry foods', $samuel, 'cooking-oil.jpg', 'Bweyogerere, Kampala', 12, 72, FoodStatus::Published],
            ['Fresh Bread', 6, 'loaves', 'Bakery', $lydia, 'bread.jpg', 'Ntinda, Kampala', 3, 20, FoodStatus::Published],
            ['Red Onions', 1, 'Kg', 'Vegetables', $grace, 'onions.jpg', 'Kiwatule, Kampala', 20, 60, FoodStatus::Published],
            ['White Rice', 3, 'Kg', 'Dry foods', $samuel, 'rice.jpg', 'Bweyogerere, Kampala', 26, 96, FoodStatus::Published],
            ['Dried Beans', 2, 'Kg', 'Dry foods', $lydia, 'beans.jpg', 'Ntinda, Kampala', 30, 120, FoodStatus::Published],
            ['Maize Flour', 5, 'Kg', 'Dry foods', $grace, 'maize.jpg', 'Kiwatule, Kampala', 34, 200, FoodStatus::Published],
            ['Fresh Milk', 2, 'L', 'Beverages', $lydia, 'milk.jpg', 'Ntinda, Kampala', 6, 18, FoodStatus::Published],
            ['Eggs', 30, 'pcs', 'Fresh', $samuel, 'eggs.jpg', 'Bweyogerere, Kampala', 10, 90, FoodStatus::Published],
            ['Brown Sugar', 2, 'Kg', 'Dry foods', $lydia, 'sugar.jpg', 'Ntinda, Kampala', 48, 240, FoodStatus::Completed],

            // Amina is the demo sign-in, so she needs her own shares for the
            // My Shared Food tab — one per status tab: active, in review, done.
            ['Sweet Potatoes', 4, 'Kg', 'Vegetables', $amina, 'vegetables.jpg', 'Nakawa, Kampala', 4, 40, FoodStatus::Published],
            ['Ripe Avocados', 8, 'pcs', 'Fruits', $amina, 'bananas.jpg', 'Nakawa, Kampala', 9, 56, FoodStatus::Published],
            ['Fresh Chapati', 10, 'pcs', 'Bakery', $amina, 'bread.jpg', 'Nakawa, Kampala', 1, 16, FoodStatus::Pending],
            ['Green Peppers', 2, 'Kg', 'Vegetables', $amina, 'onions.jpg', 'Nakawa, Kampala', 60, 300, FoodStatus::Completed],
        ];

        foreach ($rows as [$title, $amount, $unit, $category, $donor, $image, $address, $ago, $until, $status]) {
            $donation = FoodDonation::updateOrCreate(
                ['title' => $title, 'donor_id' => $donor->id],
                [
                    'food_category_id' => $categories[$category] ?? $categories->first(),
                    'country_id' => 1,
                    'amount' => $amount,
                    'unit_id' => $units[$unit] ?? null,
                    'description' => "Shared by {$donor->name}. Collect from {$address}.",
                    'pickup_address' => $address,
                    'contact_number' => $donor->phone,
                    'images' => ["food/{$image}"],
                    'expiry_date' => now()->addHours($until),
                    'status' => $status,
                    'points_required' => 0,
                ],
            );

            $donation->forceFill(['created_at' => now()->subHours($ago)])->save();
        }
    }

    private function articles(): void
    {
        $rows = [
            ['Keeping vegetables fresh for longer', 'preservation', 'harvest.jpg',
             'Store leafy greens wrapped in a damp cloth in the coolest part of your kitchen. Keep tomatoes out of direct sunlight and away from bananas, which speed up ripening. Root vegetables last longest in a dark, dry basket with air flowing around them.'],
            ['Safe handling of cooked food', 'handling', 'kitchen.jpg',
             'Cooked food should be shared within two hours of preparation, or cooled quickly and kept covered. When collecting a shared meal, reheat it thoroughly until steaming before eating. If a dish has been standing at room temperature for more than four hours, do not risk it.'],
            ['Shopping and sharing without waste', 'waste', 'market.jpg',
             'Plan meals around what needs eating first. Buy loose produce so you take only what you need. If you have bought more than your household can finish, share it while it is still at its best rather than waiting until it is close to turning.'],
            ['Composting what cannot be shared', 'community', 'compost.jpg',
             'Peelings, shells and spoiled produce still have value. A simple compost heap turns them into soil for the next season. Keep a balance of wet kitchen scraps and dry material such as leaves, and turn it every couple of weeks.'],
        ];

        foreach ($rows as [$title, $category, $image, $content]) {
            Article::updateOrCreate(
                ['title' => $title],
                [
                    'category' => $category,
                    'cover_image' => "articles/{$image}",
                    'content' => $content,
                    'is_published' => true,
                ],
            );
        }
    }

    private function communityPosts(array $users): void
    {
        $rows = [
            [$users['amina@example.com'], PostType::Request, 'Kiwatule, Kampala',
             'I need some tomatoes and onions for a family meal. Anyone nearby?', 'food/tomatoes.jpg', 1, 12, 2],
            [$users['samuel@example.com'], PostType::Offer, 'Bweyogerere, Kampala',
             'I have extra vegetables from my garden. Free for anyone who needs.', 'food/vegetables.jpg', 2, 8, 1],
            [$users['lydia@example.com'], PostType::Offer, 'Ntinda, Kampala',
             'Fresh bread available every morning before 9am. Come collect.', 'food/bread.jpg', 5, 15, 3],
            [$users['grace@example.com'], PostType::Discussion, 'Kiwatule, Kampala',
             'What is the best way to store maize flour in this humidity? Mine keeps going bad.', null, 9, 6, 4],
        ];

        $commenters = array_values($users);

        foreach ($rows as [$author, $type, $location, $content, $image, $ago, $likes, $commentCount]) {
            $post = CommunityPost::updateOrCreate(
                ['content' => $content],
                [
                    'user_id' => $author->id,
                    'post_type' => $type,
                    'location' => $location,
                    'images' => $image ? [$image] : null,
                    'status' => PostStatus::Published,
                    'likes_count' => $likes,
                    'comments_count' => $commentCount,
                ],
            );

            $post->forceFill(['created_at' => now()->subHours($ago)])->save();

            $samples = [
                'I can help with this. Sending you a message now.',
                'Still available? I am close by.',
                'Thank you for sharing with the community.',
                'Keep it in an airtight container off the floor, that fixed it for me.',
            ];

            for ($i = 0; $i < $commentCount; $i++) {
                $commenter = $commenters[($i + 1) % count($commenters)];

                CommunityComment::updateOrCreate(
                    ['community_post_id' => $post->id, 'user_id' => $commenter->id],
                    ['content' => $samples[$i % count($samples)]],
                );
            }
        }
    }

    private function ordersAndRatings(array $users): void
    {
        $receiver = $users['testreceiver@example.com'];
        $amina = $users['amina@example.com'];

        // [receiver, food title, status, daysAgo, stars, comment]
        $rows = [
            [$receiver, 'Fresh Tomatoes', OrderStatus::Pending, 0, null, null],
            [$receiver, 'Cooking Oil', OrderStatus::Accepted, 0, null, null],
            [$receiver, 'Red Onions', OrderStatus::Completed, 1, 5, 'Very fresh and easy pickup. Thank you!'],
            [$receiver, 'White Rice', OrderStatus::Completed, 3, 4, 'Good quality, collection was straightforward.'],
            [$amina, 'Dried Beans', OrderStatus::Completed, 5, 5, 'Grateful for this. The beans were perfect.'],
            [$amina, 'Fresh Bread', OrderStatus::Accepted, 0, null, null],
            [$amina, 'Brown Sugar', OrderStatus::Completed, 6, 4, null],
        ];

        foreach ($rows as [$user, $title, $status, $daysAgo, $stars, $comment]) {
            $food = FoodDonation::where('title', $title)->first();

            if (! $food) {
                continue;
            }

            $order = Order::updateOrCreate(
                ['receiver_id' => $user->id, 'food_donation_id' => $food->id],
                [
                    'status' => $status,
                    'points_spent' => 0,
                    'delivery_method' => 'pickup',
                    'scheduled_pickup_at' => $status === OrderStatus::Accepted
                        ? now()->setTime(16, 0)
                        : null,
                    'completed_at' => $status === OrderStatus::Completed ? now()->subDays($daysAgo) : null,
                ],
            );

            $order->forceFill(['created_at' => now()->subDays($daysAgo)->subHours(2)])->save();

            if ($stars !== null) {
                Rating::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'user_id' => $user->id,
                        'food_donation_id' => $food->id,
                        'stars' => $stars,
                        'comment' => $comment,
                    ],
                );
            }
        }
    }
}
